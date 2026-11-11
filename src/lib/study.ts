import type { Card, DayStat, Deck, QueueItem, Settings } from '../types'
import {
  getDeckSettings,
  orderNewCards,
  remainingNewForDeck,
  remainingReviewForDeck,
} from './deck-settings'
import { sessionOrderForDeck } from './session-order'
import { shuffle } from './utils'

/**
 * Собирает очередь с учётом настроек каждой колоды:
 * дневных лимитов новых карточек и повторений, порядка и разрешения новых.
 */
export function buildStudyQueue(
  cards: Card[],
  decks: Deck[],
  deckId: string,
  history: Record<string, DayStat>,
  settings: Settings,
  now = Date.now(),
): QueueItem[] {
  const targetDecks = deckId === 'all' ? decks : decks.filter((deck) => deck.id === deckId)
  if (!targetDecks.length) return []

  const deckIndex = new Map(decks.map((deck, index) => [deck.id, index]))
  const byDeckOrder = (a: Card, b: Card) =>
    (deckIndex.get(a.deckId) ?? 0) - (deckIndex.get(b.deckId) ?? 0) ||
    a.order - b.order ||
    a.createdAt - b.createdAt

  const dueCards: Card[] = []
  const freshCards: Card[] = []

  for (const deck of targetDecks) {
    const pool = cards.filter((card) => card.deckId === deck.id && !card.suspended)
    const reviewRemaining = remainingReviewForDeck(history, deck, now)

    const due = pool
      .filter((card) => card.srs.introduced && card.srs.due <= now)
      .sort((a, b) => a.srs.due - b.srs.due)
    dueCards.push(
      ...(Number.isFinite(reviewRemaining) ? due.slice(0, reviewRemaining) : due),
    )

    const deckSettings = getDeckSettings(deck)
    if (!deckSettings.allowNew) continue
    const remaining = remainingNewForDeck(history, deck, settings, now)
    if (remaining <= 0) continue
    freshCards.push(
      ...orderNewCards(
        pool.filter((card) => !card.srs.introduced),
        deckSettings.order,
      ).slice(0, remaining),
    )
  }

  const deck = deckId === 'all' ? undefined : targetDecks[0]
  const order = sessionOrderForDeck(deck, settings)
  let ordered: Card[]

  switch (order) {
    case 'random':
      ordered = shuffle([...dueCards, ...freshCards])
      break
    case 'deck':
      ordered = [...dueCards, ...freshCards].sort(byDeckOrder)
      break
    case 'new-first':
      ordered = [
        ...[...freshCards].sort(byDeckOrder),
        ...[...dueCards].sort(byDeckOrder),
      ]
      break
    case 'reviews-first':
    default:
      ordered = [
        ...[...dueCards].sort(byDeckOrder),
        ...[...freshCards].sort(byDeckOrder),
      ]
      break
  }

  return ordered.map<QueueItem>((card) => ({
    cardId: card.id,
    isNew: !card.srs.introduced,
  }))
}

/** Ограничивает подход первыми карточками очереди. 0 — без ограничения. */
export function limitStudySession(queue: QueueItem[], size: number): QueueItem[] {
  if (!Number.isFinite(size) || size <= 0 || queue.length <= size) return queue
  return queue.slice(0, size)
}

export function practiceQueue(
  cards: Card[],
  deckId: string,
  now = Date.now(),
  size = 10,
): QueueItem[] {
  const pool = (deckId === 'all' ? cards : cards.filter((card) => card.deckId === deckId)).filter(
    (card) => !card.suspended && card.srs.introduced,
  )
  if (!pool.length) return []
  return shuffle(pool)
    .slice(0, size)
    .map((card) => ({ cardId: card.id, isNew: false }))
}

export function dueCount(cards: Card[], deckId: string, now = Date.now()): number {
  return (deckId === 'all' ? cards : cards.filter((card) => card.deckId === deckId)).filter(
    (card) => !card.suspended && card.srs.introduced && card.srs.due <= now,
  ).length
}
