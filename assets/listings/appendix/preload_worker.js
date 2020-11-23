const { contextBridge, ipcRenderer, webFrame } = require('electron');

// Функции обработки данных
const functions = require('./utils');

// Расширение контекста процесса
contextBridge.exposeInMainWorld('appRuntime', {
  // Отправка сообщения electron-процессу
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  // Получение сообщений от electron
  subscribe: (channel, listener) => {
    const subscription = (event, ...args) => listener(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  functions: functions,
});
