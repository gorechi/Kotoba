export type Rating = 'again' | 'hard' | 'good' | 'easy'
export type Theme = 'light' | 'dark' | 'system'
export type CardGroup = 'basic' | 'voiced' | 'custom'

export type Route =
  | { name: 'home' }
  | { name: 'decks' }
  | { name: 'deck'; deckId: string }
  | { name: 'kanamap' }
  | { name: 'stats' }
  | { name: 'settings' }

export interface SrsState {
  /** Когда карточку нужно повторить (timestamp, мс). 0 — ещё не изучена. */
  due: number
  /** Интервал в днях. */
  interval: number
  ease: number
  reps: number
  lapses: number
  introduced: boolean
  lastReviewed: number | null
}

export interface Card {
  id: string
  deckId: string
  /** Японское слово или знак. */
  front: string
  /** Чтение (ромадзи или кана). */
  reading: string
  /** Чтение на кириллице (транскрипция). */
  readingCyrillic: string
  /** Перевод / значение. */
  meaning: string
  /** Пример, подсказка, заметка. */
  note: string
  /** Личная мнемоническая ассоциация для запоминания символа. */
  mnemonic: string
  /** Теги карточки для фильтрации и поиска. */
  tags: string[]
  group: CardGroup
  order: number
  srs: SrsState
  createdAt: number
}

export interface Deck {
  id: string
  name: string
  nameJp: string
  description: string
  accent: string
  builtin: boolean
  createdAt: number
}

export interface DayStat {
  reviews: number
  correct: number
  newCards: number
  ms: number
}

export interface Settings {
  theme: Theme
  newPerDay: number
  /** Какую транскрипцию показывать по умолчанию в поле «Чтение». */
  defaultTranscription: 'romaji' | 'cyrillic'
}

export interface AppData {
  version: 1
  decks: Deck[]
  cards: Card[]
  history: Record<string, DayStat>
  settings: Settings
  createdAt: number
}

export interface QueueItem {
  cardId: string
  isNew: boolean
}

/** Снимок изменений одной оценки — позволяет отменить последнюю оценку. */
export interface RatingUndo {
  cardId: string
  srs: SrsState
  historyKey: string
  day: DayStat | null
}

export interface ImportResult {
  data?: unknown
  path?: string
  error?: string
}

export interface KotobaApi {
  load: () => Promise<unknown>
  save: (data: AppData) => Promise<boolean>
  saveSync: (data: AppData) => void
  exportData: (data: AppData) => Promise<string | null>
  importData: () => Promise<ImportResult | null>
  openDataFolder: () => Promise<string>
  minimize: () => Promise<void>
  toggleMaximize: () => Promise<void>
  close: () => Promise<void>
}

declare global {
  interface Window {
    kotoba?: KotobaApi
  }
}
