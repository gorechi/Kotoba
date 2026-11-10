const fs = require('node:fs')
const path = require('node:path')

const FILES = {
  content: 'kotoba-content.json',
  settings: 'kotoba-settings.json',
  progress: 'kotoba-progress.json',
  history: 'kotoba-history.json',
  legacy: 'kotoba-data.json',
}

const RECOVERY_FILE = 'kotoba-recovery.json'
const CRITICAL_PARTS = new Set(['content', 'progress', 'history', 'legacy'])

function dataFile(userDataDir, name) {
  return path.join(userDataDir, FILES[name])
}

function recoveryFile(userDataDir) {
  return path.join(userDataDir, RECOVERY_FILE)
}

function readJsonStatus(file) {
  if (!fs.existsSync(file)) return { status: 'missing' }
  try {
    return { status: 'ok', value: JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch {
    return { status: 'corrupt' }
  }
}

function timestamp(date = new Date()) {
  const pad = (value, size = 2) => String(value).padStart(size, '0')
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
    '-',
    pad(date.getMilliseconds(), 3),
  ].join('')
}

/** Убирает повреждённый файл в сторону, чтобы он не был перезаписан. */
function preserveCorrupt(file) {
  const target = `${file}.corrupt-${timestamp()}`
  try {
    fs.renameSync(file, target)
    return target
  } catch {
    return null
  }
}

function readRecoveryState(userDataDir) {
  const result = readJsonStatus(recoveryFile(userDataDir))
  if (result.status !== 'ok') return null
  const state = result.value
  if (!state || typeof state !== 'object' || !Array.isArray(state.issues)) return null
  return state
}

function clearRecoveryState(userDataDir) {
  for (const suffix of ['', '.bak', '.tmp']) {
    try {
      fs.unlinkSync(recoveryFile(userDataDir) + suffix)
    } catch {
      /* файла может не быть */
    }
  }
}

/** Для одной части данных оставляем самую информативную проблему. */
function mergeIssues(persisted, current) {
  const byPart = new Map()
  for (const issue of persisted) byPart.set(issue.part, issue)
  for (const issue of current) {
    const existing = byPart.get(issue.part)
    if (!existing) {
      byPart.set(issue.part, issue)
      continue
    }
    if (issue.kind === 'corrupt') byPart.set(issue.part, issue)
    else if (existing.kind === 'missing' && issue.kind !== 'missing') {
      byPart.set(issue.part, issue)
    }
  }
  return [...byPart.values()]
}

function rememberIssues(userDataDir, issues) {
  const blocking = issues.filter(
    (issue) =>
      CRITICAL_PARTS.has(issue.part) &&
      (issue.kind === 'corrupt' || issue.kind === 'missing'),
  )
  if (!blocking.length) return

  const previous = readRecoveryState(userDataDir)
  const merged = mergeIssues(previous?.issues ?? [], blocking)
  writeJson(recoveryFile(userDataDir), {
    version: 1,
    createdAt: Date.now(),
    issues: merged,
  })
}

function readPart(userDataDir, part) {
  const file = dataFile(userDataDir, part)
  const main = readJsonStatus(file)
  if (main.status === 'ok') return { value: main.value, issue: null }

  if (main.status === 'missing') {
    const backup = readJsonStatus(`${file}.bak`)
    if (backup.status === 'ok') {
      return {
        value: backup.value,
        issue: {
          part,
          kind: 'recovered',
          file: path.basename(file),
          backupFile: path.basename(`${file}.bak`),
        },
      }
    }
    return { value: undefined, issue: null }
  }

  const backup = readJsonStatus(`${file}.bak`)
  const preserved = preserveCorrupt(file)

  const issue = {
    part,
    file: path.basename(file),
    backupFile: backup.status === 'ok' ? path.basename(`${file}.bak`) : undefined,
    corruptFile: preserved ? path.basename(preserved) : undefined,
  }

  // Если не удалось убрать повреждённый файл, не используем .bak: иначе
  // следующее сохранение может затереть единственную хорошую копию.
  if (backup.status === 'ok' && preserved) {
    try {
      // Сразу возвращаем хорошую копию на место: следующий запуск (и StrictMode
      // в разработке) должен увидеть уже восстановленный файл, а не пустоту.
      writeJson(file, backup.value)
    } catch {
      return { value: undefined, issue: { ...issue, kind: 'corrupt' } }
    }
    return { value: backup.value, issue: { ...issue, kind: 'recovered' } }
  }

  return { value: undefined, issue: { ...issue, kind: 'corrupt' } }
}

function hasEntries(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0,
  )
}

/**
 * Читает части данных и сообщает, что удалось восстановить, а что повреждено.
 * Пока blocked=true, рендерер не должен ничего сохранять.
 */
function readParts(userDataDir) {
  const persisted = readRecoveryState(userDataDir)
  const issues = []
  const parts = {}

  for (const part of ['content', 'settings', 'progress', 'history']) {
    const result = readPart(userDataDir, part)
    if (result.issue) issues.push(result.issue)
    if (result.value !== undefined) parts[part] = result.value
  }

  const contentCorrupt = issues.some(
    (issue) => issue.part === 'content' && issue.kind === 'corrupt',
  )
  const hasPersisted = Boolean(persisted?.issues?.length)

  // Легаси-файл подхватываем только при первом запуске/миграции, а не после ошибки.
  if (!contentCorrupt && parts.content === undefined && !hasPersisted) {
    const legacy = readPart(userDataDir, 'legacy')
    if (legacy.issue) issues.push(legacy.issue)
    if (legacy.value !== undefined) {
      return { parts: { legacy: legacy.value }, issues, blocked: false }
    }
  }

  if (parts.content === undefined && !contentCorrupt) {
    const lostContent =
      hasEntries(parts.progress) ||
      hasEntries(parts.history) ||
      parts.settings !== undefined
    if (lostContent) {
      issues.push({ part: 'content', kind: 'missing', file: FILES.content })
    }
  }

  // Старые проблемы отбрасываем, если соответствующая часть уже читается.
  const unresolvedPersisted = (persisted?.issues ?? []).filter(
    (issue) => parts[issue.part] === undefined,
  )
  if (persisted && unresolvedPersisted.length === 0) {
    clearRecoveryState(userDataDir)
  }

  const merged = mergeIssues(unresolvedPersisted, issues)
  const blocked = merged.some(
    (issue) =>
      CRITICAL_PARTS.has(issue.part) &&
      (issue.kind === 'corrupt' || issue.kind === 'missing'),
  )

  if (blocked) rememberIssues(userDataDir, merged)

  return {
    parts: Object.keys(parts).length ? parts : null,
    issues: blocked ? merged : issues,
    blocked,
  }
}

function readSettings(userDataDir) {
  const result = readJsonStatus(dataFile(userDataDir, 'settings'))
  if (result.status !== 'ok') return null
  const value = result.value
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

/**
 * Собирает полный AppData-совместимый объект для резервной копии.
 * Возвращает null, если данные сейчас заблокированы или контент не читается.
 */
function readAppData(userDataDir) {
  const result = readParts(userDataDir)
  if (result.blocked || !result.parts) return null
  if (result.parts.legacy) return result.parts.legacy

  const content = result.parts.content
  if (!content || typeof content !== 'object' || Array.isArray(content)) return null

  const progress =
    result.parts.progress &&
    typeof result.parts.progress === 'object' &&
    !Array.isArray(result.parts.progress)
      ? result.parts.progress
      : {}
  const cards = Array.isArray(content.cards) ? content.cards : []

  return {
    ...content,
    cards: cards.map((card) => {
      if (!card || typeof card !== 'object') return card
      return { ...card, srs: progress[card.id] ?? card.srs }
    }),
    settings: result.parts.settings,
    history: result.parts.history ?? {},
  }
}

/**
 * Атомарная запись с ротацией предыдущей версии в `.bak`.
 * Копирование, а не переименование: при сбое основной файл остаётся на месте.
 */
function writeJson(file, data) {
  const tmp = `${file}.tmp`
  const json = JSON.stringify(data)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(tmp, json, 'utf8')

  try {
    if (fs.existsSync(file)) {
      const backup = `${file}.bak`
      try {
        fs.unlinkSync(backup)
      } catch {
        /* старой копии может не быть */
      }
      try {
        fs.copyFileSync(file, backup)
      } catch {
        /* без .bak запись всё равно продолжится */
      }
    }
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

function writeParts(userDataDir, parts) {
  if (!parts || typeof parts !== 'object') return false

  // Прогресс и историю пишем раньше контента: если запись прервётся,
  // карточки останутся прежними, а лишние записи прогресса безвредны.
  if (parts.progress !== undefined) writeJson(dataFile(userDataDir, 'progress'), parts.progress)
  if (parts.history !== undefined) writeJson(dataFile(userDataDir, 'history'), parts.history)
  if (parts.settings !== undefined) writeJson(dataFile(userDataDir, 'settings'), parts.settings)
  if (parts.content !== undefined) {
    writeJson(dataFile(userDataDir, 'content'), parts.content)
    // Успешно записанный контент означает, что восстановление завершено.
    clearRecoveryState(userDataDir)
  }

  return true
}

module.exports = {
  FILES,
  dataFile,
  recoveryFile,
  readParts,
  writeParts,
  readSettings,
  readAppData,
  readRecoveryState,
  clearRecoveryState,
}
