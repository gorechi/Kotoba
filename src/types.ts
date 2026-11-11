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
/** Как часто создавать автоматические резервные копии. */
export type AutoBackupFrequency =
  | 'never'
  | 'on-close'
  | 'daily'
  | 'every-2-days'
  | 'every-3-days'
/** Порядок выдачи новых карточек в колоде. */
export type DeckOrder = 'order' | 'random' | 'frequency' | 'jlpt'
/** Режим изучения колоды: общий из настроек или собственный. */
export type DeckStudyMode = 'global' | StudyMode

export interface DeckStudySettings {
  /** null — использовать общий лимит новых карточек. */
  newPerDay: number | null
  /** null — без ограничения повторений. */
  reviewLimit: number | null
  /** null — использовать общий размер сессии; 0 — без ограничения. */
  sessionSize: number | null
  order: DeckOrder
  allowNew: boolean
  studyMode: DeckStudyMode
}

export type Route =
  | { name: 'home' }
  | { name: 'decks' }
  | { name: 'kanji' }
  | { name: 'deck'; deckId: string }
  | { name: 'cards'; cardId?: string; query?: string }
  | { name: 'kanamap' }
  | { name: 'stats' }
  | { name: 'data' }
  | { name: 'settings' }
  | { name: 'help' }
  | { name: 'helpGuide'; guideId: string }
  | { name: 'ttsHelp' }

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
  /** Время последней ошибки (оценки «Снова»), timestamp. Хранится вместе с прогрессом. */
  lastMistakeAt?: number
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
  /** Уровень JLPT: 5 = N5, 1 = N1. */
  jlpt?: number
  /** Частотный ранг: меньше — чаще встречается. */
  frequency?: number
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
  /** Учебные настройки колоды. */
  settings?: DeckStudySettings
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
  /** Новые карточки за день по колодам. */
  newByDeck?: Record<string, number>
  /** Все повторения за день по колодам. */
  reviewByDeck?: Record<string, number>
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
  /** Сколько карточек проходить за одну сессию; 0 — без ограничения. */
  sessionSize: number
  /** Автоматически включать режим Дзен при бездействии. */
  zenAuto: boolean
  /** Через сколько минут бездействия включать Дзен. */
  zenIdleMinutes: number
  /** Код языка интерфейса. */
  language: string
  /** Показывать ли знакомство при запуске (первый запуск). */
  onboardingDone: boolean
  /** Частота автоматических резервных копий. */
  autoBackup: AutoBackupFrequency
  /** Своя папка для автоматических копий; null — стандартная папка приложения. */
  backupFolder: string | null
}

export interface AppData {
  version: 2
  decks: Deck[]
  cards: Card[]
  studySets: StudySet[]
  /** Идентификаторы готовых наборов, которые уже установлены один раз. */
  installedPacks: string[]
  history: Record<string, DayStat>
  settings: Settings
  createdAt: number
}

export interface QueueItem {
  cardId: string
  isNew: boolean
}

export type CustomStudyStatus = 'all' | 'overdue' | 'new' | 'mistakes'
export type CustomStudyKind = 'all' | 'kana' | 'kanji'

export interface CustomStudyOptions {
  /** 'all' или id конкретной колоды. */
  deckId: string
  status: CustomStudyStatus
  kind: CustomStudyKind
  /** 5 = N5, 1 = N1. */
  jlpt?: number
  tag?: string
  /** 0 — без ограничения. */
  limit: number
}

/** Сохранённая пользовательская подборка. */
export interface StudySet {
  id: string
  name: string
  options: CustomStudyOptions
  createdAt: number
  updatedAt: number
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

export interface UpdateCheckResult {
  currentVersion?: string
  latestVersion?: string
  releaseUrl?: string
  releaseName?: string
  publishedAt?: string
  error?: string
}

export interface AutoBackupInfo {
  /** Фактическая папка, в которую пишутся автоматические копии. */
  folder: string
  /** Стандартная папка приложения. */
  defaultFolder: string
  isCustom: boolean
  frequency: AutoBackupFrequency
  lastBackupAt: number | null
  lastBackupPath: string | null
  count: number
  retention: number
}

export interface AutoBackupResult {
  path?: string
  createdAt?: number
  error?: string
}

export interface KotobaApi {
  load: () => Promise<unknown>
  saveParts: (parts: unknown) => Promise<boolean>
  savePartsSync: (parts: unknown) => boolean
  exportData: (data: AppData, title?: string) => Promise<string | null>
  importData: (title?: string) => Promise<ImportResult | null>
  openDataFolder: () => Promise<string>
  backupBeforeImport: (data: AppData) => Promise<string>
  openSpeechSettings: () => Promise<boolean>
  checkUpdates: () => Promise<UpdateCheckResult>
  getAutoBackupInfo: (settings?: Settings) => Promise<AutoBackupInfo>
  createAutoBackup: (settings?: Settings) => Promise<AutoBackupResult>
  checkAutoBackup: (settings?: Settings) => Promise<AutoBackupInfo>
  chooseBackupFolder: (title?: string) => Promise<string | null>
  openBackupFolder: (settings?: Settings) => Promise<boolean>
  minimize: () => Promise<void>
  toggleMaximize: () => Promise<void>
  close: () => Promise<void>
}

declare global {
  interface Window {
    kotoba?: KotobaApi
  }
}
