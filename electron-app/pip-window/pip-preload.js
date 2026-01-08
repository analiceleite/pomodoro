const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para a janela PiP
contextBridge.exposeInMainWorld('electron', {
  // Ações do PiP
  pipActions: {
    sendAction: (action) => ipcRenderer.invoke('pip-action', action)
  },
  
  // Controle da janela PiP
  pip: {
    close: () => ipcRenderer.invoke('close-pip')
  },
  
  // IPC Renderer para receber dados
  ipcRenderer: {
    on: (channel, callback) => {
      // Apenas permitir canais específicos por segurança
      const validChannels = ['timer-data-update'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
      }
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
});

// Log para debug
console.log('✅ PiP Preload script carregado');
