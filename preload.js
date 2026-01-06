const { contextBridge, ipcRenderer } = require('electron');

// Expor API segura para o renderizador
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    on: (channel, func) => {
      const validChannels = ['display-changed', 'window-moved'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, func);
      }
    },
    removeListener: (channel, func) => {
      const validChannels = ['display-changed', 'window-moved'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
});

// Log para debug
console.log('Preload script carregado - APIs do Electron disponíveis');