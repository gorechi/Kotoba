const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = !app.isPackaged
let mainWindow = null

function dataFile(name) {
  return path.join(app.getPath('userData'), name)
}

function contentFile() {
  return dataFile('kotoba-content.json')
}

function settingsFile() {
  return dataFile('kotoba-settings.json')
}

function progressFile() {
  return dataFile('kotoba-progress.json')
}

function historyFile() {
  return dataFile('kotoba-history.json')
}

/** Файл старого формата; остаётся как резервная копия после миграции. */
function legacyFile() {
  return dataFile('kotoba-data.json')
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function writeJson(file, data) {
  const tmp = file + '.tmp'
  const json = JSON.stringify(data)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(tmp, json, 'utf8')
  try {
    fs.renameSync(tmp, file)
  } catch {
    fs.writeFileSync(file, json, 'utf8')
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* ignore */
    }
  }
}

function readParts() {
  const content = readJson(contentFile())
  if (content) {
    return {
      content,
      settings: readJson(settingsFile()) ?? undefined,
      progress: readJson(progressFile()) ?? {},
      history: readJson(historyFile()) ?? {},
    }
  }

  const legacy = readJson(legacyFile())
  return legacy ? { legacy } : null
}

function writeParts(parts) {
  if (!parts || typeof parts !== 'object') return false

  // Прогресс и историю пишем раньше контента: если запись прервётся,
  // карточки останутся прежними, а лишние записи прогресса безвредны.
  if (parts.progress !== undefined) writeJson(progressFile(), parts.progress)
  if (parts.history !== undefined) writeJson(historyFile(), parts.history)
  if (parts.settings !== undefined) writeJson(settingsFile(), parts.settings)
  if (parts.content !== undefined) writeJson(contentFile(), parts.content)

  return true
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 960,
    minHeight: 660,
    frame: false,
    show: false,
    backgroundColor: '#F6F2EB',
    title: 'Котоба',
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
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
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

ipcMain.handle('data:load', () => readParts())
ipcMain.handle('data:save-parts', (_event, parts) => writeParts(parts))
ipcMain.on('data:save-parts-sync', (event, parts) => {
  try {
    writeParts(parts)
  } catch {
    /* не блокируем закрытие окна */
  }
  event.returnValue = true
})

ipcMain.handle('data:export', async (_event, data, title) => {
  const stamp = new Date().toISOString().slice(0, 10)
  const result = await dialog.showSaveDialog(mainWindow, {
    title: typeof title === 'string' && title ? title : undefined,
    defaultPath: path.join(app.getPath('documents'), `kotoba-backup-${stamp}.json`),
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

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:toggleMaximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.handle('window:close', () => mainWindow?.close())

app.setAppUserModelId('app.kotoba.cards')

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
