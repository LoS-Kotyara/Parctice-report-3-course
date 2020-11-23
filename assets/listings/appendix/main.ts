import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow,
  ipcMain, Menu, MenuItem } from 'electron';

let mainWindow: BrowserWindow | null = null;
let worker: BrowserWindow | null = null;

//
// Блок настроек для разработки
//

// Отображение окна приложения
const showWindows = () => {
  if (process.env.START_MINIMIZED) {
    mainWindow?.minimize();
  } else {
    mainWindow?.show();
    mainWindow?.focus();
  }
};

// Создание окон приложения
const createWindow = async () => {
  // Подключение ресурсов приложения, таких как иконки
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'resources')
    : path.join(__dirname, '../resources');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // Окно рендера приложения
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      // Отключение полной интеграции c node.js
      nodeIntegration: false,
      // Изолирование контекста процесса с целью избежать
      // пересечения с другими процессами
      contextIsolation: true,
      // Указание скрипта предзагрузки, в котором находится
      // код приложения, сгенерированный с помощью React
      preload: path.join(__dirname, './dist/renderer.prod'),
    },
  });

  // Скрытый процесс обработки
  worker = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Скрипт предзагрузки, в котором указывается
      // связь между процессами
      preload: path.join(__dirname, './worker/preload.js'),
    },
  });

  // HTML-файлы процессов рендера и обработки
  mainWindow.loadURL(`file://${__dirname}/app.html`);
  worker.loadURL(`file://${path
    .join(__dirname, './worker/worker.html')}`);

  // Показ окна только тогда, когда оно готово к отображению
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (worker?.webContents.isLoading()) {
      worker?.webContents.on('did-finish-load', () => {
        if (!worker) {
          throw new Error('"worker" is not defined');
        }

        showWindows();
      });
    } else {
      showWindows();
    }
  });

  mainWindow.on('close', () => worker?.close());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  worker.on('closed', () => {
    worker = null;
  });
};
app.allowRendererProcessReuse = true;

//
// Блоки обработки завершения работы программы
//

app.on('ready', async () => {
  // Установка моста между процессами рендера и обработки
  ipcMain.on('query-from-react', (event, data) => {
    if (worker !== null) {
      worker.webContents.send('query-from-react', data);
    } else {
      mainWindow?.webContents.send('response-from-worker', null);
    }
  });
  ipcMain.on('response-from-worker', (event, data) => {
    if (mainWindow !== null) {
      mainWindow?.webContents.send('response-from-worker', data);
    } else {
      null;
    }
  });

  // Обработчик события "Нажата правая кнопка мыши"
  // Используется для отображения контекстного меню с предложениями для замены
  ipcMain.on(
    'context-menu',
    (
      e,
      data: {
        suggestions: string[];
        word: string;
      }
    ) => {
      const menu = new Menu();

      const { suggestions, word } = data;

      const isUpperCase = word[0].toUpperCase() === word[0];

      for (const suggestion of suggestions) {
        menu.append(
          new MenuItem({
            label: suggestion,
            click: () => {
              const _suggestion = isUpperCase
                ? suggestion[0].toUpperCase() + suggestion.slice(1)
                : suggestion;

              return mainWindow?.webContents
                .replaceMisspelling(_suggestion);
            },
          })
        );
      }

      menu.append(new MenuItem({ type: 'separator' }));

      if (word) {
        menu.append(
          new MenuItem({
            label: `Добавить '${word}' в словарь`,
            click: () => {
              if (worker !== null) {
                worker.webContents.send('add-to-dictionary', word);
              } else null;
            },
          })
        );
      }

      menu.popup();
    }
  );
});
