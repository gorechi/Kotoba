import type { Card, DayStat, Deck, QueueItem, Settings } from '../types'
import {
  getDeckSettings,
  orderNewCards,
  remainingNewForDeck,
  remainingReviewForDeck,
} from './deck-settings'
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

  const dueCards: Card[] = []
  const freshByDeck = new Map<string, Card[]>()

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
    if (deckSettings.allowNew) {
      freshByDeck.set(
        deck.id,
        orderNewCards(
          pool.filter((card) => !card.srs.introduced),
          deckSettings.order,
        ),
      )
    }
  }

  dueCards.sort((a, b) => a.srs.due - b.srs.due)
  const dueItems = dueCards.map<QueueItem>((card) => ({ cardId: card.id, isNew: false }))
  const freshItems: QueueItem[] = []

  for (const deck of targetDecks) {
    const deckSettings = getDeckSettings(deck)
    if (!deckSettings.allowNew) continue
    const remaining = remainingNewForDeck(history, deck, settings, now)
    const fresh = freshByDeck.get(deck.id) ?? []
    freshItems.push(
      ...fresh.slice(0, remaining).map<QueueItem>((card) => ({
        cardId: card.id,
        isNew: true,
      })),
    )
  }

  return [...dueItems, ...freshItems]
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
