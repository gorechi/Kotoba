const { app, BrowserWindow, Menu, dialog, ipcMain, screen, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { checkUpdates } = require('./updates.cjs')
const {
  backupBeforeImport,
  checkScheduledBackup,
  createAutoBackup,
  createOnCloseBackup,
  getAutoBackupInfo,
  mergeSettings,
  resolveBackupFolder,
} = require('./backup.cjs')
const storage = require('./storage.cjs')

const isDev = !app.isPackaged
const AUTO_BACKUP_CHECK_MS = 60 * 60 * 1000
const WINDOW_STATE_FILE = 'window-state.json'
const DEFAULT_WINDOW = { width: 1200, height: 820 }
const MIN_WINDOW = { width: 960, height: 660 }
let mainWindow = null
let windowReady = false
let pendingFocus = false
let backupTimer = null
let backupWarmupTimer = null
let closeBackupDone = false
let windowSaveTimer = null

/**
 * Brings the existing window back to the foreground when a second instance
 * tries to start. This keeps the data files owned by a single writer.
 */
function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    // Окно ещё не создано (или уже закрывается). Если оно появится,
    // ready-to-show заберёт этот флаг и сфокусирует его.
    pendingFocus = true
    return
  }

  if (!windowReady) {
    pendingFocus = true
    return
  }

  try {
    if (mainWindow.isMinimized()) mainWindow.restore()
    if (!mainWindow.isVisible()) mainWindow.show()
  } catch {
    /* окно уже закрывается */
  }

  try {
    // Windows can block focus stealing; this is the documented escape hatch.
    app.focus({ steal: true })
  } catch {
    /* not supported on all platforms */
  }

  try {
    mainWindow.focus()
  } catch {
    /* окно уже закрывается */
  }
}

function startAutoBackupScheduler() {
  const run = () => {
    try {
      const result = checkScheduledBackup(app.getPath('userData'))
      if (result?.error) {
        console.error('[kotoba] auto backup failed', result.error)
      }
    } catch (error) {
      console.error('[kotoba] auto backup check failed', error)
    }
  }

  // Даём рендереру сохранить настройки после загрузки, затем проверяем срок.
  backupWarmupTimer = setTimeout(run, 5000)
  backupTimer = setInterval(run, AUTO_BACKUP_CHECK_MS)
}

function runOnCloseBackup() {
  if (closeBackupDone) return
  closeBackupDone = true
  try {
    const result = createOnCloseBackup(app.getPath('userData'))
    if (result?.error) {
      console.error('[kotoba] auto backup on close failed', result.error)
    }
  } catch (error) {
    console.error('[kotoba] auto backup on close failed', error)
  }
}

function windowStatePath() {
  return path.join(app.getPath('userData'), WINDOW_STATE_FILE)
}

/** Окно должно оставаться хотя бы частично видимым после смены монитора. */
function isVisibleOnDisplays(bounds) {
  try {
    return screen.getAllDisplays().some((display) => {
      const area = display.workArea
      return (
        bounds.x < area.x + area.width - 80 &&
        bounds.x + bounds.width > area.x + 80 &&
        bounds.y < area.y + area.height - 80 &&
        bounds.y + bounds.height > area.y + 40
      )
    })
  } catch {
    return false
  }
}

function readWindowState() {
  try {
    const raw = JSON.parse(fs.readFileSync(windowStatePath(), 'utf8'))
    if (!raw || typeof raw !== 'object') return null
    const width = Math.max(MIN_WINDOW.width, Math.round(Number(raw.width) || DEFAULT_WINDOW.width))
    const height = Math.max(
      MIN_WINDOW.height,
      Math.round(Number(raw.height) || DEFAULT_WINDOW.height),
    )
    const hasPosition = Number.isFinite(raw.x) && Number.isFinite(raw.y)
    if (!hasPosition) return { width, height, maximized: Boolean(raw.maximized) }

    const state = {
      x: Math.round(raw.x),
      y: Math.round(raw.y),
      width,
      height,
      maximized: Boolean(raw.maximized),
    }
    if (!isVisibleOnDisplays(state)) {
      return { width, height, maximized: state.maximized }
    }
    return state
  } catch {
    return null
  }
}

function saveWindowState() {
  if (windowSaveTimer) {
    clearTimeout(windowSaveTimer)
    windowSaveTimer = null
  }
  if (!mainWindow || mainWindow.isDestroyed()) return
  try {
    const maximized = mainWindow.isMaximized()
    const bounds = mainWindow.getNormalBounds()
    if (bounds.width < MIN_WINDOW.width || bounds.height < MIN_WINDOW.height) return
    fs.writeFileSync(
      windowStatePath(),
      JSON.stringify({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        maximized,
      }),
      'utf8',
    )
  } catch (error) {
    console.error('[kotoba] could not save window state', error)
  }
}

function scheduleWindowStateSave() {
  if (windowSaveTimer) clearTimeout(windowSaveTimer)
  windowSaveTimer = setTimeout(saveWindowState, 400)
}

function createWindow() {
  windowReady = false
  const savedWindow = readWindowState()
  const windowBounds = savedWindow
    ? {
        width: savedWindow.width,
        height: savedWindow.height,
        ...(savedWindow.x !== undefined && savedWindow.y !== undefined
          ? { x: savedWindow.x, y: savedWindow.y }
          : {}),
      }
    : DEFAULT_WINDOW
  mainWindow = new BrowserWindow({
    ...windowBounds,
    minWidth: MIN_WINDOW.width,
    minHeight: MIN_WINDOW.height,
    frame: false,
    show: false,
    backgroundColor: '#F6F2EB',
    title: 'Kotoba',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    if (savedWindow?.maximized) mainWindow.maximize()
    windowReady = true
    mainWindow.show()
    if (pendingFocus) {
      pendingFocus = false
      focusMainWindow()
    }
  })

  mainWindow.on('resize', scheduleWindowStateSave)
  mainWindow.on('move', scheduleWindowStateSave)
  mainWindow.on('maximize', scheduleWindowStateSave)
  mainWindow.on('unmaximize', scheduleWindowStateSave)
  mainWindow.on('close', saveWindowState)

  mainWindow.on('closed', () => {
    mainWindow = null
    windowReady = false
  })

  if (isDev) {
    const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    mainWindow.loadURL(url)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL
    if (devUrl && url.startsWith(devUrl)) return
    if (url.startsWith('file://')) return
    event.preventDefault()
    if (/^https?:/i.test(url)) shell.openExternal(url)
  })
}

ipcMain.handle('data:load', () => storage.readParts(app.getPath('userData')))
ipcMain.handle('data:save-parts', (_event, parts) =>
  storage.writeParts(app.getPath('userData'), parts),
)
ipcMain.on('data:save-parts-sync', (event, parts) => {
  try {
    event.returnValue = storage.writeParts(app.getPath('userData'), parts) !== false
  } catch {
    event.returnValue = false
  }
})

ipcMain.handle('data:export', async (_event, data, title, filename) => {
  const stamp = new Date().toISOString().slice(0, 10)
  const requested =
    typeof filename === 'string' && filename.trim()
      ? path.basename(filename.trim())
      : `kotoba-backup-${stamp}.json`
  const result = await dialog.showSaveDialog(mainWindow, {
    title: typeof title === 'string' && title ? title : undefined,
    defaultPath: path.join(app.getPath('documents'), requested),
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (result.canceled || !result.filePath) return null
  fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8')
  return result.filePath
})

ipcMain.handle('data:import', async (_event, title) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: typeof title === 'string' && title ? title : undefined,
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (result.canceled || !result.filePaths[0]) return null
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf8')
    return { data: JSON.parse(raw), path: result.filePaths[0] }
  } catch (error) {
    return { error: String(error) }
  }
})

ipcMain.handle('data:openFolder', async () => {
  const folder = app.getPath('userData')
  await shell.openPath(folder)
  return folder
})

ipcMain.handle('data:backup-before-import', (_event, data) =>
  backupBeforeImport(app.getPath('userData'), data),
)

ipcMain.handle('data:backup-info', (_event, settingsOverride) => {
  const userData = app.getPath('userData')
  const settings = mergeSettings(storage.readSettings(userData), settingsOverride) ?? {}
  return getAutoBackupInfo(userData, settings)
})

ipcMain.handle('data:check-auto-backup', (_event, settingsOverride) => {
  const userData = app.getPath('userData')
  try {
    const result = checkScheduledBackup(userData, settingsOverride)
    if (result?.error) {
      console.error('[kotoba] auto backup failed', result.error)
    }
  } catch (error) {
    console.error('[kotoba] auto backup check failed', error)
  }
  const settings = mergeSettings(storage.readSettings(userData), settingsOverride) ?? {}
  return getAutoBackupInfo(userData, settings)
})

ipcMain.handle('data:create-auto-backup', (_event, settingsOverride) => {
  const userData = app.getPath('userData')
  const settings = mergeSettings(storage.readSettings(userData), settingsOverride) ?? {}
  const result = createAutoBackup(userData, settings)
  if (result.error) {
    console.error('[kotoba] manual auto backup failed', result.error)
  }
  return result
})

ipcMain.handle('data:choose-backup-folder', async (_event, title) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: typeof title === 'string' && title ? title : undefined,
    properties: ['openDirectory', 'createDirectory'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  return result.filePaths[0]
})

ipcMain.handle('data:open-backup-folder', async (_event, settingsOverride) => {
  const userData = app.getPath('userData')
  const settings = mergeSettings(storage.readSettings(userData), settingsOverride) ?? {}
  const target = resolveBackupFolder(userData, settings)
  try {
    fs.mkdirSync(target, { recursive: true })
  } catch {
    return false
  }
  const error = await shell.openPath(target)
  return !error
})

ipcMain.handle('system:open-speech-settings', async () => {
  try {
    await shell.openExternal('ms-settings:speech')
    return true
  } catch {
    try {
      await shell.openExternal('ms-settings:regionlanguage')
      return true
    } catch {
      return false
    }
  }
})

ipcMain.handle('app:check-updates', () => checkUpdates(app.getVersion()))

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:toggleMaximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.handle('window:close', () => mainWindow?.close())

app.setAppUserModelId('app.kotoba.cards')

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // Второй экземпляр не должен открывать окно и трогать те же файлы данных.
  app.quit()
} else {
  app.on('second-instance', () => {
    if (isDev) {
      console.log('[kotoba] second instance detected; focusing existing window')
    }
    focusMainWindow()
  })

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    createWindow()
    startAutoBackupScheduler()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('before-quit', () => {
    if (backupWarmupTimer) {
      clearTimeout(backupWarmupTimer)
      backupWarmupTimer = null
    }
    if (backupTimer) {
      clearInterval(backupTimer)
      backupTimer = null
    }
    runOnCloseBackup()
  })

  app.on('window-all-closed', () => {
    runOnCloseBackup()
    app.quit()
  })
}
