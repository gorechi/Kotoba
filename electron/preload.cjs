const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kotoba', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  saveSync: (data) => ipcRenderer.sendSync('data:save-sync', data),
  exportData: (data, title) => ipcRenderer.invoke('data:export', data, title),
  importData: (title) => ipcRenderer.invoke('data:import', title),
  openDataFolder: () => ipcRenderer.invoke('data:openFolder'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  close: () => ipcRenderer.invoke('window:close'),
})
