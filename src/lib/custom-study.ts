import type {
  Card,
  CustomStudyKind,
  CustomStudyOptions,
  CustomStudyStatus,
  Deck,
  QueueItem,
} from '../types'
import { DAY } from './srs'
import { shuffle } from './utils'

export type {
  CustomStudyKind,
  CustomStudyOptions,
  CustomStudyStatus,
} from '../types'

export type CustomStudyPreset =
  | 'overdue'
  | 'new'
  | 'jlpt5'
  | 'jlpt4'
  | 'kanji'
  | 'marathon'
  | 'mistakes'

/** Готовые подборки с главного экрана. */
export function presetOptions(preset: CustomStudyPreset, tag?: string): CustomStudyOptions {
  switch (preset) {
    case 'overdue':
      return { deckId: 'all', status: 'overdue', kind: 'all', limit: 0 }
    case 'new':
      return { deckId: 'all', status: 'new', kind: 'all', limit: 0 }
    case 'jlpt5':
      return { deckId: 'all', status: 'all', kind: 'all', jlpt: 5, limit: 50 }
    case 'jlpt4':
      return { deckId: 'all', status: 'all', kind: 'all', jlpt: 4, limit: 50 }
    case 'kanji':
      return { deckId: 'all', status: 'all', kind: 'kanji', limit: 50 }
    case 'marathon':
      return { deckId: 'all', status: 'all', kind: 'all', limit: 50 }
    case 'mistakes':
      return { deckId: 'all', status: 'mistakes', kind: 'all', limit: 50 }
    default:
      return {
        deckId: 'all',
        status: 'all',
        kind: 'all',
        tag: tag || undefined,
        limit: 50,
      }
  }
}

function sortPool(cards: Card[], status: CustomStudyStatus): Card[] {
  const pool = [...cards]
  if (status === 'overdue') {
    return pool.sort((a, b) => a.srs.due - b.srs.due)
  }
  if (status === 'new') {
    return pool.sort((a, b) => a.createdAt - b.createdAt || a.order - b.order)
  }
  if (status === 'mistakes') {
    return pool.sort(
      (a, b) => (b.srs.lastMistakeAt ?? 0) - (a.srs.lastMistakeAt ?? 0),
    )
  }
  return shuffle(pool)
}

/**
 * Собирает очередь для пользовательской подборки.
 * Не учитывает дневные лимиты колод — это осознанный режим «своя подборка».
 */
export function buildCustomStudyQueue(
  cards: Card[],
  decks: Deck[],
  options: CustomStudyOptions,
  now = Date.now(),
): QueueItem[] {
  const deckMap = new Map(decks.map((deck) => [deck.id, deck]))
  const weekAgo = now - 7 * DAY

  const pool = cards.filter((card) => {
    if (card.suspended) return false
    const deck = deckMap.get(card.deckId)
    if (!deck) return false
    if (options.deckId !== 'all' && card.deckId !== options.deckId) return false
    if (options.kind !== 'all' && deck.kind !== options.kind) return false
    if (options.jlpt !== undefined && card.jlpt !== options.jlpt) return false
    if (options.tag && !card.tags.includes(options.tag)) return false

    if (options.status === 'new') return !card.srs.introduced
    if (options.status === 'overdue') {
      return card.srs.introduced && card.srs.due <= now
    }
    if (options.status === 'mistakes') {
      return (
        card.srs.introduced &&
        typeof card.srs.lastMistakeAt === 'number' &&
        card.srs.lastMistakeAt >= weekAgo
      )
    }
    return true
  })

  const sorted = sortPool(pool, options.status)
  const limited = options.limit > 0 ? sorted.slice(0, options.limit) : sorted
  return limited.map((card) => ({ cardId: card.id, isNew: !card.srs.introduced }))
}
