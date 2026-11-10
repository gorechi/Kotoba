const fs = require('node:fs')
const path = require('node:path')
const storage = require('./storage.cjs')

const AUTO_BACKUP_PREFIX = 'kotoba-auto-'
const AUTO_BACKUP_RETENTION = 7
const DEFAULT_FREQUENCY = 'daily'

function timestamp(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
}

function writeBackupFile(file, data) {
  const tmp = `${file}.tmp`
  const json = JSON.stringify(data, null, 2)
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

/**
 * Сохраняет страховочную копию данных перед импортом.
 * Файлы лежат рядом с данными приложения, в папке `backups`.
 */
function backupBeforeImport(userDataDir, data, date = new Date()) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup data')
  }

  const dir = path.join(userDataDir, 'backups')
  fs.mkdirSync(dir, { recursive: true })

  const base = `kotoba-before-import-${timestamp(date)}`
  let file = path.join(dir, `${base}.json`)
  let counter = 1
  while (fs.existsSync(file)) {
    file = path.join(dir, `${base}-${counter}.json`)
    counter += 1
  }

  writeBackupFile(file, data)
  return file
}

function mergeSettings(stored, override) {
  const base = stored && typeof stored === 'object' ? stored : {}
  if (override && typeof override === 'object') return { ...base, ...override }
  return Object.keys(base).length ? base : null
}

/** null/пустая строка — стандартная папка приложения. */
function resolveBackupFolder(userDataDir, settings) {
  const custom =
    settings && typeof settings.backupFolder === 'string'
      ? settings.backupFolder.trim()
      : ''
  if (!custom) return path.join(userDataDir, 'backups')
  return path.isAbsolute(custom) ? custom : path.resolve(userDataDir, custom)
}

function listAutoBackups(folder) {
  let entries = []
  try {
    entries = fs.readdirSync(folder, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(AUTO_BACKUP_PREFIX) &&
        entry.name.endsWith('.json'),
    )
    .map((entry) => {
      const file = path.join(folder, entry.name)
      try {
        const stat = fs.statSync(file)
        return { path: file, name: entry.name, mtimeMs: stat.mtimeMs, size: stat.size }
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))
}

function getAutoBackupInfo(userDataDir, settings) {
  const folder = resolveBackupFolder(userDataDir, settings)
  const backups = listAutoBackups(folder)
  const latest = backups[0] ?? null
  const frequency =
    settings && typeof settings.autoBackup === 'string'
      ? settings.autoBackup
      : DEFAULT_FREQUENCY

  return {
    folder,
    defaultFolder: path.join(userDataDir, 'backups'),
    isCustom: Boolean(
      settings &&
        typeof settings.backupFolder === 'string' &&
        settings.backupFolder.trim(),
    ),
    frequency,
    lastBackupAt: latest ? latest.mtimeMs : null,
    lastBackupPath: latest ? latest.path : null,
    count: backups.length,
    retention: AUTO_BACKUP_RETENTION,
  }
}

function localDayIndex(ts) {
  const date = new Date(ts)
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
}

function isAutoBackupDue(settings, info, now = Date.now()) {
  const frequency =
    settings && typeof settings.autoBackup === 'string'
      ? settings.autoBackup
      : DEFAULT_FREQUENCY
  const interval =
    frequency === 'daily'
      ? 1
      : frequency === 'every-2-days'
        ? 2
        : frequency === 'every-3-days'
          ? 3
          : 0

  if (!interval) return false
  if (!info.lastBackupAt) return true
  return localDayIndex(now) - localDayIndex(info.lastBackupAt) >= interval
}

function pruneAutoBackups(folder) {
  const backups = listAutoBackups(folder)
  for (const backup of backups.slice(AUTO_BACKUP_RETENTION)) {
    try {
      fs.unlinkSync(backup.path)
    } catch {
      /* ignore */
    }
  }
}

function createAutoBackup(userDataDir, settings, date = new Date()) {
  try {
    const data = storage.readAppData(userDataDir)
    if (!data) return { error: 'Data is not readable right now' }

    const folder = resolveBackupFolder(userDataDir, settings)
    fs.mkdirSync(folder, { recursive: true })

    const base = `${AUTO_BACKUP_PREFIX}${timestamp(date)}`
    let file = path.join(folder, `${base}.json`)
    let counter = 1
    while (fs.existsSync(file)) {
      file = path.join(folder, `${base}-${counter}.json`)
      counter += 1
    }

    writeBackupFile(file, data)
    pruneAutoBackups(folder)
    return { path: file, createdAt: date.getTime() }
  } catch (error) {
    return { error: String(error) }
  }
}

/** Создаёт копию, если подошёл срок. Используется планировщиком и UI. */
function checkScheduledBackup(userDataDir, settingsOverride, now = Date.now()) {
  const settings =
    mergeSettings(storage.readSettings(userDataDir), settingsOverride) ?? {}
  const info = getAutoBackupInfo(userDataDir, settings)

  if (!isAutoBackupDue(settings, info, now)) {
    return { skipped: true, info }
  }

  const result = createAutoBackup(userDataDir, settings, new Date(now))
  return {
    ...result,
    info: getAutoBackupInfo(userDataDir, settings),
  }
}

/** Копия при закрытии создаётся только если пользователь выбрал этот режим. */
function createOnCloseBackup(userDataDir, date = new Date()) {
  const settings = storage.readSettings(userDataDir)
  if (!settings || settings.autoBackup !== 'on-close') return null
  return createAutoBackup(userDataDir, settings, date)
}

module.exports = {
  AUTO_BACKUP_RETENTION,
  backupBeforeImport,
  checkScheduledBackup,
  createAutoBackup,
  createOnCloseBackup,
  getAutoBackupInfo,
  isAutoBackupDue,
  mergeSettings,
  resolveBackupFolder,
}
