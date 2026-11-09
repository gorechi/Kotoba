export type Rating = 'again' | 'hard' | 'good' | 'easy'
export type Theme = 'light' | 'dark' | 'system'
export type CardGroup = 'basic' | 'voiced' | 'custom'
/** Тип колоды: обычные карточки (кана/слова) или карточки-иероглифы. */
export type DeckKind = 'kana' | 'kanji'
/** Режим сеанса: чтение (японский → ответ) или письмо (перевод → японский). */
export type StudyMode = 'reading' | 'writing'
/** Сложность режима письма. */
export type WritingDifficulty = 'normal' | 'hard'
/** Чем измеряется ежедневная цель. */
export type DailyGoalType = 'reviews' | 'minutes'

export type Route =
  | { name: 'home' }
  | { name: 'decks' }
  | { name: 'kanji' }
  | { name: 'deck'; deckId: string }
  | { name: 'cards' }
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
  /** Перевод / значение. */
  meaning: string
  /** Пример, подсказка, заметка. */
  note: string
  /** Личная мнемоническая ассоциация для запоминания символа. */
  mnemonic: string
  /** Теги карточки для фильтрации и поиска. */
  tags: string[]
  /** Карточка временно исключена из учёбы. */
  suspended?: boolean
  /** Чтения иероглифа: кана + транскрипция (для карточек-иероглифов). */
  readings: CardReading[]
  /** Примеры использования (для карточек-иероглифов). */
  examples: CardExample[]
  group: CardGroup
  order: number
  srs: SrsState
  createdAt: number
}

/** Пара «слово каной + транскрипция» на обороте карточки-иероглифа. */
export interface CardReading {
  id: string
  kana: string
  transcription: string
}

/** Пример использования иероглифа. */
export interface CardExample {
  id: string
  /** Иероглифическое написание слова или фразы. */
  text: string
  /** Транскрипция. */
  transcription: string
  /** Перевод на русский. */
  translation: string
}

export interface Deck {
  id: string
  name: string
  nameJp: string
  description: string
  accent: string
  builtin: boolean
  /** Обычная колода или колода иероглифов. */
  kind: DeckKind
  createdAt: number
}

export interface StudyTotals {
  reviews: number
  correct: number
  newCards: number
  ms: number
}

export interface DayStat extends StudyTotals {
  /** Подмножество счётчиков за режим письма (входит в общие значения выше). */
  writing?: StudyTotals
}

export interface Settings {
  theme: Theme
  newPerDay: number
  /** Какую транскрипцию показывать по умолчанию в поле «Чтение». */
  defaultTranscription: 'romaji' | 'cyrillic'
  /** Последний выбранный режим сеанса. */
  studyMode: StudyMode
  /** Сложность режима письма. */
  writingDifficulty: WritingDifficulty
  /** Чем измеряется ежедневная цель. */
  dailyGoalType: DailyGoalType
  /** Цель по повторениям в день. */
  dailyReviewGoal: number
  /** Цель по минутам учёбы в день. */
  dailyMinuteGoal: number
  /** Личная цель по общему числу повторений. */
  goalReviews: number
  /** Личная цель по выученным карточкам. */
  goalCards: number
  /** Личная цель по серии дней. */
  goalStreak: number
  /** Код языка интерфейса. */
  language: string
}

export interface AppData {
  version: 2
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
  saveParts: (parts: unknown) => Promise<boolean>
  savePartsSync: (parts: unknown) => void
  exportData: (data: AppData, title?: string) => Promise<string | null>
  importData: (title?: string) => Promise<ImportResult | null>
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
