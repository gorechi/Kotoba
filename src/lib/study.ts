import type { Card, QueueItem } from '../types'
import { shuffle } from './utils'

export function studyQueue(
  cards: Card[],
  deckId: string,
  newLimit: number,
  now = Date.now(),
): QueueItem[] {
  const pool = deckId === 'all' ? cards : cards.filter((card) => card.deckId === deckId)
  const due = pool
    .filter((card) => card.srs.introduced && card.srs.due <= now)
    .sort((a, b) => a.srs.due - b.srs.due)
    .map<QueueItem>((card) => ({ cardId: card.id, isNew: false }))

  const fresh = pool
    .filter((card) => !card.srs.introduced)
    .sort((a, b) => a.order - b.order)
    .slice(0, Math.max(0, newLimit))
    .map<QueueItem>((card) => ({ cardId: card.id, isNew: true }))

  return [...due, ...fresh]
}

export function practiceQueue(
  cards: Card[],
  deckId: string,
  now = Date.now(),
  size = 10,
): QueueItem[] {
  const pool = (deckId === 'all' ? cards : cards.filter((card) => card.deckId === deckId)).filter(
    (card) => card.srs.introduced,
  )
  if (!pool.length) return []
  return shuffle(pool)
    .slice(0, size)
    .map((card) => ({ cardId: card.id, isNew: false }))
}

export function dueCount(cards: Card[], deckId: string, now = Date.now()): number {
  return (deckId === 'all' ? cards : cards.filter((card) => card.deckId === deckId)).filter(
    (card) => card.srs.introduced && card.srs.due <= now,
  ).length
}
