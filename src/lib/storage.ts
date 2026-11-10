import type { AppData, Card, DayStat, Settings, SrsState } from '../types'

/** Карточка в файле контента — без прогресса SRS. */
export type StoredCard = Omit<Card, 'srs'>

/** Редко меняющийся контент: колоды, карточки и общие метаданные. */
export interface StoredContent {
  version: 2
  decks: AppData['decks']
  cards: StoredCard[]
  studySets: AppData['studySets']
  installedPacks: AppData['installedPacks']
  createdAt: number
}

/**
 * Части, из которых собирается AppData.
 * Контент, настройки и прогресс хранятся раздельно, чтобы ответ на карточку
 * не перезаписывал тысячи карточек.
 */
export interface StorageParts {
  content?: StoredContent
  settings?: Settings
  progress?: Record<string, SrsState>
  history?: Record<string, DayStat>
}

/** Данные, прочитанные из хранилища до нормализации. */
export interface LoadedParts {
  content?: unknown
  settings?: unknown
  progress?: unknown
  history?: unknown
  /** Старый формат: единый kotoba-data.json / localStorage. */
  legacy?: unknown
}

export type StoragePart = 'content' | 'settings' | 'progress' | 'history' | 'legacy'

export type StorageIssueKind = 'recovered' | 'corrupt' | 'missing' | 'load-error'

export interface StorageIssue {
  part: StoragePart
  kind: StorageIssueKind
  /** Имя файла, с которым возникла проблема. */
  file?: string
  /** Резервная копия, из которой удалось восстановиться. */
  backupFile?: string
  /** Куда сохранён повреждённый файл. */
  corruptFile?: string
  message?: string
}

export interface StorageLoadResult {
  parts: LoadedParts | null
  issues: StorageIssue[]
  /** true — данные читаются частично; рендерер не должен ничего сохранять. */
  blocked: boolean
}

export interface DirtyFlags {
  content: boolean
  settings: boolean
  progress: boolean
  history: boolean
}

export const ALL_DIRTY: DirtyFlags = {
  content: true,
  settings: true,
  progress: true,
  history: true,
}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function progressFromAppData(data: AppData): Record<string, SrsState> {
  const progress: Record<string, SrsState> = {}
  for (const card of data.cards) progress[card.id] = card.srs
  return progress
}

export function splitAppData(data: AppData): Required<StorageParts> {
  const cards: StoredCard[] = data.cards.map((card) => {
    const { srs: _srs, ...content } = card
    return content
  })

  return {
    content: {
      version: 2,
      decks: data.decks,
      cards,
      studySets: data.studySets ?? [],
      installedPacks: data.installedPacks ?? [],
      createdAt: data.createdAt,
    },
    settings: data.settings,
    progress: progressFromAppData(data),
    history: data.history,
  }
}

/** Собирает части в форму, которую понимает normalizeData. */
export function combineLoadedParts(parts: LoadedParts): unknown {
  if (parts.legacy !== undefined) return parts.legacy

  const content = isObj(parts.content) ? parts.content : null
  if (!content) return null

  const progress = isObj(parts.progress) ? parts.progress : {}
  const cards = Array.isArray(content.cards) ? content.cards : []

  return {
    ...content,
    settings: isObj(parts.settings) ? parts.settings : content.settings,
    history: isObj(parts.history) ? parts.history : {},
    cards: cards.map((card) => {
      if (!isObj(card)) return card
      const id = typeof card.id === 'string' ? card.id : ''
      return { ...card, srs: progress[id] }
    }),
  }
}

/** Оставляет только те части, которые изменились. */
export function partsForFlags(data: AppData, flags: DirtyFlags): StorageParts {
  // При изменении контента мог поменяться и набор карточек, поэтому
  // карту прогресса тоже нужно перезаписать (добавление/удаление карточек).
  const needsContent = flags.content
  const needsProgress = flags.progress || flags.content
  const needsHistory = flags.history

  if (!needsContent && !flags.settings && !needsProgress && !needsHistory) return {}

  const split = needsContent ? splitAppData(data) : null
  const parts: StorageParts = {}
  if (split) parts.content = split.content
  if (flags.settings) parts.settings = data.settings
  if (needsProgress) parts.progress = split ? split.progress : progressFromAppData(data)
  if (needsHistory) parts.history = data.history
  return parts
}

export function hasParts(parts: StorageParts): boolean {
  return (
    parts.content !== undefined ||
    parts.settings !== undefined ||
    parts.progress !== undefined ||
    parts.history !== undefined
  )
}

function hasWindowApi(): boolean {
  return typeof window !== 'undefined' && Boolean(window.kotoba)
}

function isLoadResult(value: unknown): value is StorageLoadResult {
  return (
    isObj(value) &&
    'parts' in value &&
    Array.isArray(value.issues) &&
    typeof value.blocked === 'boolean'
  )
}

// ---------------------------------------------------------------------------
// Веб-хранилище: IndexedDB. localStorage используется только как аварийный
// снимок при закрытии вкладки и как запасной вариант, если IndexedDB недоступен.
// ---------------------------------------------------------------------------

const DB_NAME = 'kotoba'
const DB_VERSION = 1
const STORE_NAME = 'parts'
const LEGACY_KEY = 'kotoba-data-v1'
const EMERGENCY_KEY = 'kotoba-emergency-v2'
const FALLBACK_KEYS = {
  content: 'kotoba-content-v2',
  settings: 'kotoba-settings-v2',
  progress: 'kotoba-progress-v2',
  history: 'kotoba-history-v2',
  savedAt: 'kotoba-saved-at-v2',
} as const

function readLocalJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function readEmergency(): { savedAt: number; parts: StorageParts } | null {
  const raw = readLocalJson(EMERGENCY_KEY)
  if (!isObj(raw) || !isObj(raw.parts)) return null
  const savedAt = typeof raw.savedAt === 'number' ? raw.savedAt : 0
  return { savedAt, parts: raw.parts as StorageParts }
}

function readFallbackParts(): LoadedParts {
  return {
    content: readLocalJson(FALLBACK_KEYS.content),
    settings: readLocalJson(FALLBACK_KEYS.settings),
    progress: readLocalJson(FALLBACK_KEYS.progress),
    history: readLocalJson(FALLBACK_KEYS.history),
  }
}

function saveFallback(parts: StorageParts): void {
  try {
    if (parts.content !== undefined) localStorage.setItem(FALLBACK_KEYS.content, JSON.stringify(parts.content))
    if (parts.settings !== undefined) localStorage.setItem(FALLBACK_KEYS.settings, JSON.stringify(parts.settings))
    if (parts.progress !== undefined) localStorage.setItem(FALLBACK_KEYS.progress, JSON.stringify(parts.progress))
    if (parts.history !== undefined) localStorage.setItem(FALLBACK_KEYS.history, JSON.stringify(parts.history))
    localStorage.setItem(FALLBACK_KEYS.savedAt, String(Date.now()))

    const emergency = readEmergency()
    if (emergency) {
      const keys = Object.keys(emergency.parts) as Array<keyof StorageParts>
      if (keys.every((key) => parts[key] !== undefined)) localStorage.removeItem(EMERGENCY_KEY)
    }
  } catch {
    /* localStorage может быть переполнен — аварийный снимок останется */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

async function idbReadAll(): Promise<Record<string, unknown>> {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const keys = ['content', 'settings', 'progress', 'history', 'savedAt'] as const
      const result: Record<string, unknown> = {}
      let pending = keys.length
      for (const key of keys) {
        const request = store.get(key)
        request.onsuccess = () => {
          result[key] = request.result
          pending -= 1
          if (pending === 0) resolve(result)
        }
        request.onerror = () => reject(request.error)
      }
    })
  } finally {
    db.close()
  }
}

async function idbSave(parts: StorageParts): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      if (parts.content !== undefined) store.put(parts.content, 'content')
      if (parts.settings !== undefined) store.put(parts.settings, 'settings')
      if (parts.progress !== undefined) store.put(parts.progress, 'progress')
      if (parts.history !== undefined) store.put(parts.history, 'history')
      store.put(Date.now(), 'savedAt')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB save failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
    })
  } finally {
    db.close()
  }
}

async function loadWeb(): Promise<LoadedParts | null> {
  let stored: Record<string, unknown> = {}
  try {
    stored = await idbReadAll()
  } catch {
    /* IndexedDB недоступен — ниже попробуем localStorage */
  }

  const fallback = readFallbackParts()
  const fallbackSavedAtRaw = readLocalJson(FALLBACK_KEYS.savedAt)
  const fallbackSavedAt =
    typeof fallbackSavedAtRaw === 'number' ? fallbackSavedAtRaw : 0
  if (
    fallback.content !== undefined &&
    (stored.content === undefined || fallbackSavedAt >= Number(stored.savedAt ?? 0))
  ) {
    stored = {
      content: fallback.content,
      settings: fallback.settings,
      progress: fallback.progress,
      history: fallback.history,
      savedAt: fallbackSavedAt,
    }
  }

  const loaded: LoadedParts = {
    content: stored.content,
    settings: stored.settings,
    progress: stored.progress,
    history: stored.history,
  }

  const emergency = readEmergency()
  if (emergency) {
    if (loaded.content === undefined || emergency.savedAt >= Number(stored.savedAt ?? 0)) {
      Object.assign(loaded, emergency.parts)
    } else {
      try {
        localStorage.removeItem(EMERGENCY_KEY)
      } catch {
        /* ignore */
      }
    }
  }

  if (loaded.content === undefined) {
    const legacy = readLocalJson(LEGACY_KEY)
    if (legacy !== undefined) return { legacy }
    return null
  }

  return loaded
}

async function saveWeb(parts: StorageParts): Promise<void> {
  await idbSave(parts)

  if (parts.content !== undefined) {
    try {
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      /* ignore */
    }
  }

  const emergency = readEmergency()
  if (emergency) {
    const keys = Object.keys(emergency.parts) as Array<keyof StorageParts>
    const covered = keys.every((key) => parts[key] !== undefined)
    if (covered) {
      try {
        localStorage.removeItem(EMERGENCY_KEY)
      } catch {
        /* ignore */
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Публичный интерфейс хранилища
// ---------------------------------------------------------------------------

export async function loadStorage(): Promise<StorageLoadResult> {
  if (hasWindowApi()) {
    const raw = await window.kotoba!.load()
    // Совместимость со старым preload, который возвращал только parts.
    if (isLoadResult(raw)) return raw
    return {
      parts: (raw as LoadedParts | null) ?? null,
      issues: [],
      blocked: false,
    }
  }

  try {
    return { parts: await loadWeb(), issues: [], blocked: false }
  } catch (error) {
    return {
      parts: null,
      issues: [{ part: 'content', kind: 'load-error', message: String(error) }],
      blocked: true,
    }
  }
}

export async function saveStorage(parts: StorageParts): Promise<void> {
  if (!hasParts(parts)) return
  if (hasWindowApi()) {
    const saved = await window.kotoba!.saveParts(parts)
    if (!saved) throw new Error('Electron save failed')
    return
  }
  try {
    await saveWeb(parts)
  } catch {
    saveFallback(parts)
  }
}

export function saveStorageSync(parts: StorageParts): boolean {
  if (!hasParts(parts)) return true
  if (hasWindowApi()) {
    return window.kotoba!.savePartsSync(parts)
  }

  let emergencySaved = false
  try {
    localStorage.setItem(EMERGENCY_KEY, JSON.stringify({ savedAt: Date.now(), parts }))
    emergencySaved = true
  } catch {
    /* если не влезло — останется последняя успешная запись */
  }
  void saveStorage(parts).catch(() => {
    /* аварийный снимок уже записан, если это удалось */
  })
  return emergencySaved
}
