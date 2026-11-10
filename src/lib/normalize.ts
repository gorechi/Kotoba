import type {
  AppData,
  AutoBackupFrequency,
  Card,
  CardExample,
  CardGroup,
  CardReading,
  CustomStudyKind,
  CustomStudyOptions,
  CustomStudyStatus,
  DailyGoalType,
  DayStat,
  Deck,
  DeckKind,
  DeckOrder,
  DeckStudyMode,
  DeckStudySettings,
  Settings,
  SrsState,
  StudyMode,
  StudySet,
  StudyTotals,
  Theme,
  WritingDifficulty,
} from '../types'
import { freshSrs } from './srs'
import { uid } from './utils'
import { createBaseSeedData, createSeedData } from '../data/seed'
import { LEGACY_N5_EXAMPLES, LEGACY_N5_MEANINGS } from '../data/legacy-n5'
import { DEFAULT_LOCALE, isLocaleCode } from './i18n'

const THEMES: Theme[] = ['light', 'dark', 'system']
const DECK_KINDS: DeckKind[] = ['kana', 'kanji']
const STUDY_MODES: StudyMode[] = ['reading', 'writing']
const WRITING_DIFFICULTIES: WritingDifficulty[] = ['normal', 'hard']
const DAILY_GOAL_TYPES: DailyGoalType[] = ['reviews', 'minutes']
const DECK_ORDERS: DeckOrder[] = ['order', 'random', 'frequency', 'jlpt']
const DECK_STUDY_MODES: DeckStudyMode[] = ['global', 'reading', 'writing']
const CUSTOM_STUDY_STATUSES: CustomStudyStatus[] = ['all', 'overdue', 'new', 'mistakes']
const CUSTOM_STUDY_KINDS: CustomStudyKind[] = ['all', 'kana', 'kanji']
const AUTO_BACKUP_FREQUENCIES: AutoBackupFrequency[] = [
  'never',
  'on-close',
  'daily',
  'every-2-days',
  'every-3-days',
]

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeSrs(raw: unknown): SrsState {
  if (!isObj(raw)) return freshSrs()
  const interval = clamp(num(raw.interval, 0), 0, 3650)
  const lastMistakeAt = num(raw.lastMistakeAt, 0)
  return {
    due: Math.max(0, num(raw.due, 0)),
    interval,
    ease: clamp(num(raw.ease, 2.3), 1.3, 2.8),
    reps: Math.max(0, Math.round(num(raw.reps, 0))),
    lapses: Math.max(0, Math.round(num(raw.lapses, 0))),
    introduced: Boolean(raw.introduced) || num(raw.reps, 0) > 0,
    lastReviewed: typeof raw.lastReviewed === 'number' ? raw.lastReviewed : null,
    lastMistakeAt: lastMistakeAt > 0 ? lastMistakeAt : undefined,
  }
}

function normalizeDeckSettings(raw: unknown): DeckStudySettings {
  const base: DeckStudySettings = {
    newPerDay: null,
    reviewLimit: null,
    order: 'order',
    allowNew: true,
    studyMode: 'global',
  }
  if (!isObj(raw)) return base

  return {
    newPerDay:
      raw.newPerDay === null || raw.newPerDay === undefined
        ? null
        : clamp(Math.round(num(raw.newPerDay, 1)), 1, 500),
    reviewLimit:
      raw.reviewLimit === null || raw.reviewLimit === undefined
        ? null
        : clamp(Math.round(num(raw.reviewLimit, 1)), 1, 2000),
    order: DECK_ORDERS.includes(raw.order as DeckOrder)
      ? (raw.order as DeckOrder)
      : base.order,
    allowNew: raw.allowNew !== false,
    studyMode: DECK_STUDY_MODES.includes(raw.studyMode as DeckStudyMode)
      ? (raw.studyMode as DeckStudyMode)
      : base.studyMode,
  }
}

function normalizeDeck(raw: unknown): Deck | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !raw.id.trim()) return null
  return {
    id: raw.id,
    name: str(raw.name, ''),
    nameJp: str(raw.nameJp, ''),
    description: str(raw.description, ''),
    accent: /^#[0-9a-f]{6}$/i.test(str(raw.accent)) ? str(raw.accent) : '#E1523D',
    builtin: Boolean(raw.builtin),
    kind: DECK_KINDS.includes(raw.kind as DeckKind) ? (raw.kind as DeckKind) : 'kana',
    settings: normalizeDeckSettings(raw.settings),
    createdAt: num(raw.createdAt, Date.now()),
  }
}

const CARD_GROUPS: CardGroup[] = ['basic', 'voiced', 'custom']

function normalizeReadings(raw: unknown): CardReading[] {
  if (!Array.isArray(raw)) return []
  const result: CardReading[] = []
  for (const item of raw) {
    if (!isObj(item)) continue
    const kana = str(item.kana).trim()
    const transcription = str(item.transcription).trim()
    if (!kana && !transcription) continue
    result.push({
      id: typeof item.id === 'string' && item.id ? item.id : uid('reading'),
      kana,
      transcription,
    })
  }
  return result
}

function normalizeExamples(raw: unknown): CardExample[] {
  if (!Array.isArray(raw)) return []
  const result: CardExample[] = []
  for (const item of raw) {
    if (!isObj(item)) continue
    const text = str(item.text).trim()
    const transcription = str(item.transcription).trim()
    const translation = str(item.translation).trim()
    if (!text && !transcription && !translation) continue
    result.push({
      id: typeof item.id === 'string' && item.id ? item.id : uid('example'),
      text,
      transcription,
      translation,
    })
  }
  return result
}

function normalizeCard(raw: unknown): Card | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || typeof raw.deckId !== 'string') return null
  if (typeof raw.front !== 'string' || !raw.front.trim()) return null
  const group = CARD_GROUPS.includes(raw.group as CardGroup)
    ? (raw.group as CardGroup)
    : 'custom'
  const jlpt = Math.round(num(raw.jlpt, 0))
  const frequency = Math.round(num(raw.frequency, 0))
  const srs = normalizeSrs(raw.srs)
  const legacyMistakeAt = num(raw.lastMistakeAt, 0)
  if (!srs.lastMistakeAt && legacyMistakeAt > 0) {
    // Миграция старого формата: ошибка раньше лежала в контенте карточки.
    srs.lastMistakeAt = legacyMistakeAt
  }
  return {
    id: raw.id,
    deckId: raw.deckId,
    front: raw.front,
    reading: str(raw.reading),
    meaning: str(raw.meaning),
    note: str(raw.note),
    mnemonic: str(raw.mnemonic),
    tags: strArray(raw.tags),
    jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
    frequency: frequency > 0 ? frequency : undefined,
    suspended: Boolean(raw.suspended),
    readings: normalizeReadings(raw.readings),
    examples: normalizeExamples(raw.examples),
    group,
    order: num(raw.order, 0),
    srs,
    createdAt: num(raw.createdAt, Date.now()),
  }
}

function normalizeStudySetOptions(raw: unknown): CustomStudyOptions {
  const value = isObj(raw) ? raw : {}
  const jlpt = Math.round(num(value.jlpt, 0))
  const limit = Math.max(0, Math.round(num(value.limit, 50)))
  const deckId = typeof value.deckId === 'string' && value.deckId.trim()
    ? value.deckId.trim()
    : 'all'
  const status = CUSTOM_STUDY_STATUSES.includes(value.status as CustomStudyStatus)
    ? (value.status as CustomStudyStatus)
    : 'all'
  const kind = CUSTOM_STUDY_KINDS.includes(value.kind as CustomStudyKind)
    ? (value.kind as CustomStudyKind)
    : 'all'
  const tag = typeof value.tag === 'string' && value.tag.trim()
    ? value.tag.trim()
    : undefined
  return {
    deckId,
    status,
    kind,
    jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
    tag,
    limit,
  }
}

function normalizeStudySets(raw: unknown): StudySet[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: StudySet[] = []
  for (const item of raw) {
    if (!isObj(item)) continue
    const id = typeof item.id === 'string' && item.id ? item.id : uid('set')
    if (seen.has(id)) continue
    const name = str(item.name).trim()
    if (!name) continue
    seen.add(id)
    const createdAt = num(item.createdAt, Date.now())
    result.push({
      id,
      name,
      options: normalizeStudySetOptions(item.options),
      createdAt,
      updatedAt: num(item.updatedAt, createdAt),
    })
  }
  return result
}

function normalizeTotals(raw: unknown): StudyTotals | null {
  if (!isObj(raw)) return null
  return {
    reviews: Math.max(0, Math.round(num(raw.reviews, 0))),
    correct: Math.max(0, Math.round(num(raw.correct, 0))),
    newCards: Math.max(0, Math.round(num(raw.newCards, 0))),
    ms: Math.max(0, num(raw.ms, 0)),
  }
}

function normalizeDeckCounts(raw: unknown): Record<string, number> | undefined {
  if (!isObj(raw)) return undefined
  const counts: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!key || typeof value !== 'number' || !Number.isFinite(value)) continue
    const count = Math.max(0, Math.round(value))
    if (count > 0) counts[key] = count
  }
  return Object.keys(counts).length ? counts : undefined
}

function normalizeHistory(raw: unknown): Record<string, DayStat> {
  if (!isObj(raw)) return {}
  const history: Record<string, DayStat> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !isObj(value)) continue
    const day: DayStat = normalizeTotals(value) ?? { reviews: 0, correct: 0, newCards: 0, ms: 0 }
    const writing = normalizeTotals(value.writing)
    if (writing && (writing.reviews || writing.correct || writing.newCards || writing.ms)) {
      // Письмо — подмножество общего счётчика дня.
      day.reviews = Math.max(day.reviews, writing.reviews)
      day.correct = Math.max(day.correct, writing.correct)
      day.newCards = Math.max(day.newCards, writing.newCards)
      day.ms = Math.max(day.ms, writing.ms)
      day.writing = writing
    }
    const newByDeck = normalizeDeckCounts(value.newByDeck)
    if (newByDeck) day.newByDeck = newByDeck
    const reviewByDeck = normalizeDeckCounts(value.reviewByDeck)
    if (reviewByDeck) day.reviewByDeck = reviewByDeck
    history[key] = day
  }
  return history
}

function normalizeSettings(raw: unknown): Settings {
  const base: Settings = {
    theme: 'system',
    newPerDay: 10,
    defaultTranscription: 'romaji',
    studyMode: 'reading',
    writingDifficulty: 'normal',
    dailyGoalType: 'reviews',
    dailyReviewGoal: 20,
    dailyMinuteGoal: 15,
    goalReviews: 1000,
    goalCards: 100,
    goalStreak: 30,
    zenAuto: true,
    zenIdleMinutes: 5,
    language: DEFAULT_LOCALE,
    // Для уже существующих данных знакомство не показываем повторно.
    onboardingDone: true,
    autoBackup: 'daily',
    backupFolder: null,
  }
  if (!isObj(raw)) return base
  return {
    theme: THEMES.includes(raw.theme as Theme) ? (raw.theme as Theme) : base.theme,
    newPerDay: clamp(Math.round(num(raw.newPerDay, base.newPerDay)), 1, 50),
    defaultTranscription:
      raw.defaultTranscription === 'cyrillic' ? 'cyrillic' : 'romaji',
    studyMode: STUDY_MODES.includes(raw.studyMode as StudyMode)
      ? (raw.studyMode as StudyMode)
      : base.studyMode,
    writingDifficulty: WRITING_DIFFICULTIES.includes(raw.writingDifficulty as WritingDifficulty)
      ? (raw.writingDifficulty as WritingDifficulty)
      : base.writingDifficulty,
    dailyGoalType: DAILY_GOAL_TYPES.includes(raw.dailyGoalType as DailyGoalType)
      ? (raw.dailyGoalType as DailyGoalType)
      : base.dailyGoalType,
    dailyReviewGoal: clamp(
      Math.round(num(raw.dailyReviewGoal, base.dailyReviewGoal)),
      1,
      500,
    ),
    dailyMinuteGoal: clamp(
      Math.round(num(raw.dailyMinuteGoal, base.dailyMinuteGoal)),
      5,
      600,
    ),
    goalReviews: clamp(Math.round(num(raw.goalReviews, base.goalReviews)), 10, 1_000_000),
    goalCards: clamp(Math.round(num(raw.goalCards, base.goalCards)), 1, 100_000),
    goalStreak: clamp(Math.round(num(raw.goalStreak, base.goalStreak)), 1, 10_000),
    zenAuto: raw.zenAuto !== false,
    zenIdleMinutes: clamp(
      Math.round(num(raw.zenIdleMinutes, base.zenIdleMinutes)),
      1,
      120,
    ),
    language: isLocaleCode(raw.language) ? raw.language : base.language,
    onboardingDone: raw.onboardingDone !== false,
    autoBackup: AUTO_BACKUP_FREQUENCIES.includes(raw.autoBackup as AutoBackupFrequency)
      ? (raw.autoBackup as AutoBackupFrequency)
      : base.autoBackup,
    backupFolder:
      typeof raw.backupFolder === 'string' && raw.backupFolder.trim()
        ? raw.backupFolder.trim()
        : null,
  }
}

function stripLegacyN5Text(cards: Card[]): void {
  for (const card of cards) {
    const number = card.id.match(/^kanji-n5-(\d{3})$/)?.[1]
    if (!number) continue

    const legacyMeaning = LEGACY_N5_MEANINGS[number]
    if (legacyMeaning && card.meaning === legacyMeaning) {
      card.meaning = ''
    }

    for (const example of card.examples) {
      const exampleNumber = example.id.match(/^example-\d{3}-(\d+)$/)?.[1]
      if (!exampleNumber) continue
      const legacyText = LEGACY_N5_EXAMPLES[number]?.[exampleNumber]
      if (legacyText && example.translation === legacyText) {
        example.translation = ''
      }
    }
  }
}

/**
 * Нормализует только колоды и карточки из резервной копии — без seed-данных.
 * Нужна для предпросмотра и объединения, чтобы не подмешивать встроенные колоды.
 */
export function normalizeImported(raw: unknown): { decks: Deck[]; cards: Card[] } {
  if (!isObj(raw)) return { decks: [], cards: [] }

  const decks = (Array.isArray(raw.decks) ? raw.decks : [])
    .map(normalizeDeck)
    .filter((deck): deck is Deck => deck !== null)
  const cards = (Array.isArray(raw.cards) ? raw.cards : [])
    .map(normalizeCard)
    .filter((card): card is Card => card !== null)

  const seenDecks = new Set<string>()
  const uniqueDecks = decks.filter((deck) => {
    if (seenDecks.has(deck.id)) return false
    seenDecks.add(deck.id)
    return true
  })

  const validDeckIds = new Set(uniqueDecks.map((deck) => deck.id))
  const seenCards = new Set<string>()
  const uniqueCards = cards.filter((card) => {
    if (!validDeckIds.has(card.deckId) || seenCards.has(card.id)) return false
    seenCards.add(card.id)
    return true
  })

  return { decks: uniqueDecks, cards: uniqueCards }
}

export function normalizeData(raw: unknown): AppData {
  const seed = createBaseSeedData()
  if (!isObj(raw)) return createSeedData()

  const decks = (Array.isArray(raw.decks) ? raw.decks : [])
    .map(normalizeDeck)
    .filter((deck): deck is Deck => deck !== null)

  const cards = (Array.isArray(raw.cards) ? raw.cards : [])
    .map(normalizeCard)
    .filter((card): card is Card => card !== null)

  const seenDecks = new Set<string>()
  const uniqueDecks = decks.filter((deck) => {
    if (seenDecks.has(deck.id)) return false
    seenDecks.add(deck.id)
    return true
  })

  const seenCards = new Set<string>()
  const uniqueCards = cards.filter((card) => {
    if (seenCards.has(card.id)) return false
    seenCards.add(card.id)
    return true
  })

  const mergedDecks: Deck[] = [
    ...seed.decks.filter((seedDeck) => !uniqueDecks.some((deck) => deck.id === seedDeck.id)),
    ...uniqueDecks,
  ]

  const validDeckIds = new Set(mergedDecks.map((deck) => deck.id))
  const existingCardIds = new Set(uniqueCards.map((card) => card.id))
  const restoredSeedCards = seed.cards.filter(
    (card) => validDeckIds.has(card.deckId) && !existingCardIds.has(card.id),
  )

  const mergedCards = [...uniqueCards, ...restoredSeedCards].filter((card) =>
    validDeckIds.has(card.deckId),
  )

  stripLegacyN5Text(mergedCards)

  return {
    version: 2,
    decks: mergedDecks,
    cards: mergedCards,
    studySets: normalizeStudySets(raw.studySets),
    installedPacks: [...new Set(strArray(raw.installedPacks))],
    history: normalizeHistory(raw.history),
    settings: normalizeSettings(raw.settings),
    createdAt: num(raw.createdAt, Date.now()),
  }
}
