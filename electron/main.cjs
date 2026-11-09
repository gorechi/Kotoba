const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = !app.isPackaged
let mainWindow = null

function dataFile() {
  return path.join(app.getPath('userData'), 'kotoba-data.json')
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(dataFile(), 'utf8'))
  } catch {
    return null
  }
}

function writeData(data) {
  const file = dataFile()
  const tmp = file + '.tmp'
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  try {
    fs.renameSync(tmp, file)
  } catch {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* ignore */
    }
  }
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

ipcMain.handle('data:load', () => readData())
ipcMain.handle('data:save', (_event, data) => {
  writeData(data)
  return true
})
ipcMain.on('data:save-sync', (event, data) => {
  try {
    writeData(data)
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
