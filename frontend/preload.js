const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  
  // Theme sync
  sendThemeChange: (color) => ipcRenderer.send('theme-change', color),
  onThemeChange: (callback) => ipcRenderer.on('theme-change', (event, color) => callback(color)),
  
  // App Control
  quitApp: () => ipcRenderer.send('quit-app'),
  setPlayerVisibility: (visible) => ipcRenderer.send('set-player-visibility', visible)
});
