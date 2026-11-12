const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kotoba', {
  load: () => ipcRenderer.invoke('data:load'),
  saveParts: (parts) => ipcRenderer.invoke('data:save-parts', parts),
  savePartsSync: (parts) => ipcRenderer.sendSync('data:save-parts-sync', parts),
  exportData: (data, title, filename) =>
    ipcRenderer.invoke('data:export', data, title, filename),
  importData: (title) => ipcRenderer.invoke('data:import', title),
  openDataFolder: () => ipcRenderer.invoke('data:openFolder'),
  backupBeforeImport: (data) => ipcRenderer.invoke('data:backup-before-import', data),
  getAutoBackupInfo: (settings) => ipcRenderer.invoke('data:backup-info', settings),
  createAutoBackup: (settings) => ipcRenderer.invoke('data:create-auto-backup', settings),
  checkAutoBackup: (settings) => ipcRenderer.invoke('data:check-auto-backup', settings),
  chooseBackupFolder: (title) => ipcRenderer.invoke('data:choose-backup-folder', title),
  openBackupFolder: (settings) => ipcRenderer.invoke('data:open-backup-folder', settings),
  openSpeechSettings: () => ipcRenderer.invoke('system:open-speech-settings'),
  checkUpdates: () => ipcRenderer.invoke('app:check-updates'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  close: () => ipcRenderer.invoke('window:close'),
})
