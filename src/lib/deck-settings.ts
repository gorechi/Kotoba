import type {
  Card,
  DayStat,
  Deck,
  DeckOrder,
  DeckStudySettings,
  Settings,
  StudyMode,
} from '../types'
import { dayKey, shuffle } from './utils'

export const DEFAULT_DECK_SETTINGS: DeckStudySettings = {
  newPerDay: null,
  reviewLimit: null,
  sessionSize: null,
  order: 'order',
  allowNew: true,
  studyMode: 'global',
}

export function getDeckSettings(deck: Deck): DeckStudySettings {
  return deck.settings ?? DEFAULT_DECK_SETTINGS
}

export function effectiveStudyMode(deck: Deck | undefined, global: StudyMode): StudyMode {
  if (!deck) return global
  const mode = getDeckSettings(deck).studyMode
  return mode === 'global' ? global : mode
}

/** Размер сессии для колоды: 0 — без ограничения. */
export function sessionSizeForDeck(
  deck: Deck | undefined,
  settings: Settings,
): number {
  if (deck) {
    const own = getDeckSettings(deck).sessionSize
    if (own !== null) return own
  }
  return settings.sessionSize
}

export function usedNewForDeck(
  history: Record<string, DayStat>,
  deckId: string,
  now = Date.now(),
): number {
  return history[dayKey(now)]?.newByDeck?.[deckId] ?? 0
}

export function usedReviewsForDeck(
  history: Record<string, DayStat>,
  deckId: string,
  now = Date.now(),
): number {
  return history[dayKey(now)]?.reviewByDeck?.[deckId] ?? 0
}

export function remainingNewForDeck(
  history: Record<string, DayStat>,
  deck: Deck,
  settings: Settings,
  now = Date.now(),
): number {
  const deckSettings = getDeckSettings(deck)
  if (!deckSettings.allowNew) return 0
  const limit = deckSettings.newPerDay ?? settings.newPerDay
  return Math.max(0, limit - usedNewForDeck(history, deck.id, now))
}

export function remainingNewTotal(
  history: Record<string, DayStat>,
  decks: Deck[],
  settings: Settings,
  now = Date.now(),
): number {
  return decks.reduce(
    (total, deck) => total + remainingNewForDeck(history, deck, settings, now),
    0,
  )
}

export function remainingReviewForDeck(
  history: Record<string, DayStat>,
  deck: Deck,
  now = Date.now(),
): number {
  const limit = getDeckSettings(deck).reviewLimit
  if (limit === null) return Number.POSITIVE_INFINITY
  return Math.max(0, limit - usedReviewsForDeck(history, deck.id, now))
}

export function orderNewCards(cards: Card[], order: DeckOrder): Card[] {
  const copy = [...cards]
  switch (order) {
    case 'random':
      return shuffle(copy)
    case 'frequency':
      return copy.sort(
        (a, b) =>
          (a.frequency ?? Number.MAX_SAFE_INTEGER) -
            (b.frequency ?? Number.MAX_SAFE_INTEGER) ||
          a.order - b.order ||
          a.createdAt - b.createdAt,
      )
    case 'jlpt':
      return copy.sort(
        (a, b) =>
          (b.jlpt ?? 0) - (a.jlpt ?? 0) ||
          a.order - b.order ||
          a.createdAt - b.createdAt,
      )
    case 'order':
    default:
      return copy.sort(
        (a, b) => a.order - b.order || a.createdAt - b.createdAt,
      )
  }
}
