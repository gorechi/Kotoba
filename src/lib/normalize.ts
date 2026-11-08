import type {
  AppData,
  Card,
  CardGroup,
  DayStat,
  Deck,
  Settings,
  SrsState,
  StudyMode,
  StudyTotals,
  Theme,
  WritingDifficulty,
} from '../types'
import { freshSrs } from './srs'
import { createSeedData } from '../data/seed'

const THEMES: Theme[] = ['light', 'dark', 'system']
const STUDY_MODES: StudyMode[] = ['reading', 'writing']
const WRITING_DIFFICULTIES: WritingDifficulty[] = ['normal', 'hard']

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
  return {
    due: Math.max(0, num(raw.due, 0)),
    interval,
    ease: clamp(num(raw.ease, 2.3), 1.3, 2.8),
    reps: Math.max(0, Math.round(num(raw.reps, 0))),
    lapses: Math.max(0, Math.round(num(raw.lapses, 0))),
    introduced: Boolean(raw.introduced) || num(raw.reps, 0) > 0,
    lastReviewed: typeof raw.lastReviewed === 'number' ? raw.lastReviewed : null,
  }
}

function normalizeDeck(raw: unknown): Deck | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !raw.id.trim()) return null
  return {
    id: raw.id,
    name: str(raw.name, 'Без названия'),
    nameJp: str(raw.nameJp, ''),
    description: str(raw.description, ''),
    accent: /^#[0-9a-f]{6}$/i.test(str(raw.accent)) ? str(raw.accent) : '#E1523D',
    builtin: Boolean(raw.builtin),
    createdAt: num(raw.createdAt, Date.now()),
  }
}

const CARD_GROUPS: CardGroup[] = ['basic', 'voiced', 'custom']

function normalizeCard(raw: unknown): Card | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || typeof raw.deckId !== 'string') return null
  if (typeof raw.front !== 'string' || !raw.front.trim()) return null
  const group = CARD_GROUPS.includes(raw.group as CardGroup)
    ? (raw.group as CardGroup)
    : 'custom'
  return {
    id: raw.id,
    deckId: raw.deckId,
    front: raw.front,
    reading: str(raw.reading),
    meaning: str(raw.meaning),
    note: str(raw.note),
    mnemonic: str(raw.mnemonic),
    tags: strArray(raw.tags),
    group,
    order: num(raw.order, 0),
    srs: normalizeSrs(raw.srs),
    createdAt: num(raw.createdAt, Date.now()),
  }
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
  }
}

export function normalizeData(raw: unknown): AppData {
  const seed = createSeedData()
  if (!isObj(raw)) return seed

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

  return {
    version: 1,
    decks: mergedDecks,
    cards: mergedCards,
    history: normalizeHistory(raw.history),
    settings: normalizeSettings(raw.settings),
    createdAt: num(raw.createdAt, Date.now()),
  }
}
