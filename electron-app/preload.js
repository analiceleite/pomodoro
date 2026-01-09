const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Always on top
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  getAlwaysOnTopStatus: () => ipcRenderer.invoke('get-always-on-top-status'),
  setAlwaysOnTop: (enable) => ipcRenderer.invoke('set-always-on-top', enable),

  // Picture-in-Picture
  openPiP: () => ipcRenderer.invoke('open-pip'),
  closePiP: () => ipcRenderer.invoke('close-pip'),
  pipAction: (action) => ipcRenderer.invoke('pip-action', action),
  sendDataToPiP: (data) => ipcRenderer.invoke('send-data-to-pip', data),

  // Native notification helper
  showNotification: (payload) => ipcRenderer.invoke('show-notification', payload),

  // Listeners
  onPipActionReceived: (callback) => {
    ipcRenderer.on('pip-action-received', (event, action) => callback(action));
  },
  onPipWindowClosed: (callback) => {
    ipcRenderer.on('pip-window-closed', () => callback());
  },

  // Remover listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log para debug
console.log('✅ Preload script carregado - electronAPI disponível:', !!window.electronAPI);