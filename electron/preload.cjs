const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kotoba', {
  load: () => ipcRenderer.invoke('data:load'),
  saveParts: (parts) => ipcRenderer.invoke('data:save-parts', parts),
  savePartsSync: (parts) => ipcRenderer.sendSync('data:save-parts-sync', parts),
  exportData: (data, title) => ipcRenderer.invoke('data:export', data, title),
  importData: (title) => ipcRenderer.invoke('data:import', title),
  openDataFolder: () => ipcRenderer.invoke('data:openFolder'),
  openSpeechSettings: () => ipcRenderer.invoke('system:open-speech-settings'),
  checkUpdates: () => ipcRenderer.invoke('app:check-updates'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  close: () => ipcRenderer.invoke('window:close'),
})
