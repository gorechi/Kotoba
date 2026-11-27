import type { AppData, Card } from '../types'
import { isProtectedDeck } from './content'

interface MergeDecksResult {
  data: AppData
  merged: boolean
  /** Сколько карточек переехало в целевую колоду. */
  cards: number
}

function byOrder(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)
}

/**
 * Переносит все карточки исходной колоды в целевую и удаляет исходную.
 * Порядок пересобирается заново: сначала карточки цели, затем перенесённые.
 * Удалённые карточки исходной колоды переезжают в целевую, чтобы их можно
 * было восстановить и они не остались привязанными к несуществующей колоде.
 */
export function mergeDecks(
  current: AppData,
  sourceId: string,
  targetId: string,
): MergeDecksResult {
  if (sourceId === targetId) return { data: current, merged: false, cards: 0 }

  const source = current.decks.find((deck) => deck.id === sourceId)
  const target = current.decks.find((deck) => deck.id === targetId)
  if (!source || !target) return { data: current, merged: false, cards: 0 }
  if (source.kind !== target.kind) return { data: current, merged: false, cards: 0 }
  if (isProtectedDeck(source) || isProtectedDeck(target)) {
    return { data: current, merged: false, cards: 0 }
  }

  const sourceCards = byOrder(current.cards.filter((card) => card.deckId === sourceId))
  const targetCards = byOrder(current.cards.filter((card) => card.deckId === targetId))

  const ordered: Card[] = [
    ...targetCards.map((card, index) => ({ ...card, order: index })),
    ...sourceCards.map((card, index) => ({
      ...card,
      deckId: target.id,
      order: targetCards.length + index,
    })),
  ]
  const byId = new Map(ordered.map((card) => [card.id, card]))
  const now = Date.now()

  return {
    data: {
      ...current,
      decks: current.decks.filter((deck) => deck.id !== sourceId),
      cards: current.cards.map((card) => byId.get(card.id) ?? card),
      trash: current.trash.map((entry) =>
        entry.kind === 'card' && entry.card.deckId === sourceId
          ? { ...entry, card: { ...entry.card, deckId: target.id } }
          : entry,
      ),
      studySets: current.studySets.map((set) =>
        set.options.deckId === sourceId
          ? {
              ...set,
              options: { ...set.options, deckId: target.id },
              updatedAt: now,
            }
          : set,
      ),
    },
    merged: true,
    cards: sourceCards.length,
  }
}
