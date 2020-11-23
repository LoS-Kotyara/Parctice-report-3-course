import { ipcRenderer, webFrame } from 'electron';
type Unsubscribe = () => void;
type Listener = (...args: any[]) => void;

// Интерфейс работы с electron-процессом
interface AppRuntime {
  send: (channel: string, data: any) => void;
  subscribe: (channel: string, listener: Listener) => Unsubscribe;
  once: (channel: string, listener: Listener) => void;
  webFrame: Electron.WebFrame;
}

const appRuntime = ((window as any).appRuntime = {
  // Отправка сообщений electron-процессу
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  // Получение первого ответа от electron
  once: (channel, listener) => {
    const subscription = 
      (event: any, ...args: any[]) => listener(...args);
    ipcRenderer.once(channel, subscription);
  },
  // Получение всех ответов от electron
  subscribe: (channel, listener) => {
    const subscription =
      (event: any, ...args: any[]) => listener(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  webFrame: webFrame,
} as AppRuntime);

export default appRuntime;
