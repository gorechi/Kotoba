import { describe, expect, it } from 'vitest'
import { mergeDecks } from './deck-ops'
import type { StudySet } from '../types'
import { makeCard, makeData, makeDeck, makeSrs } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()

function studySet(deckId: string): StudySet {
  return {
    id: 'set-1',
    name: 'Set',
    options: { deckId, status: 'all', kind: 'kana', limit: 50 },
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('mergeDecks', () => {
  it('переносит карточки в целевую колоду и удаляет исходную', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'source' }), makeDeck({ id: 'target' })],
      cards: [
        makeCard({ id: 'target-1', deckId: 'target', order: 5 }),
        makeCard({ id: 'source-1', deckId: 'source', order: 2 }),
        makeCard({ id: 'source-2', deckId: 'source', order: 1 }),
      ],
    })

    const result = mergeDecks(data, 'source', 'target')

    expect(result.merged).toBe(true)
    expect(result.cards).toBe(2)
    expect(result.data.decks.map((deck) => deck.id)).toEqual(['target'])
    expect(result.data.cards).toHaveLength(3)
    expect(result.data.cards.every((card) => card.deckId === 'target')).toBe(true)
  })

  it('пересобирает порядок: сначала карточки цели, затем перенесённые', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'source' }), makeDeck({ id: 'target' })],
      cards: [
        makeCard({ id: 'target-1', deckId: 'target', order: 9 }),
        makeCard({ id: 'source-2', deckId: 'source', order: 20 }),
        makeCard({ id: 'source-1', deckId: 'source', order: 3 }),
      ],
    })

    const ordered = [...mergeDecks(data, 'source', 'target').data.cards].sort(
      (a, b) => a.order - b.order,
    )

    expect(ordered.map((card) => [card.id, card.order])).toEqual([
      ['target-1', 0],
      ['source-1', 1],
      ['source-2', 2],
    ])
  })

  it('сохраняет прогресс SRS', () => {
    const srs = makeSrs({ interval: 42, reps: 7 })
    const data = makeData({
      decks: [makeDeck({ id: 'source' }), makeDeck({ id: 'target' })],
      cards: [makeCard({ id: 'source-1', deckId: 'source', srs })],
    })

    const result = mergeDecks(data, 'source', 'target')
    expect(result.data.cards[0].srs).toEqual(srs)
  })

  it('переносит удалённые карточки исходной колоды в целевую', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'source' }), makeDeck({ id: 'target' })],
      trash: [
        {
          id: 'card-9',
          kind: 'card',
          deletedAt: NOW,
          card: makeCard({ id: 'card-9', deckId: 'source' }),
        },
      ],
    })

    const result = mergeDecks(data, 'source', 'target')
    const entry = result.data.trash[0]
    expect(entry.kind === 'card' && entry.card.deckId).toBe('target')
  })

  it('переключает пользовательские наборы на целевую колоду', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'source' }), makeDeck({ id: 'target' })],
      studySets: [studySet('source'), studySet('other')],
    })

    const result = mergeDecks(data, 'source', 'target')
    expect(result.data.studySets[0].options.deckId).toBe('target')
    expect(result.data.studySets[1].options.deckId).toBe('other')
  })

  it('отказывается объединять колоду саму с собой', () => {
    const data = makeData({ decks: [makeDeck({ id: 'deck-1' })] })
    expect(mergeDecks(data, 'deck-1', 'deck-1').merged).toBe(false)
  })

  it('отказывается объединять колоды разных типов', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'kana', kind: 'kana' }), makeDeck({ id: 'kanji', kind: 'kanji' })],
    })
    expect(mergeDecks(data, 'kana', 'kanji').merged).toBe(false)
  })

  it('не трогает защищённые встроенные азбуки', () => {
    const data = makeData({
      decks: [
        makeDeck({ id: 'builtin', builtin: true, kind: 'kana' }),
        makeDeck({ id: 'custom', kind: 'kana' }),
      ],
    })
    expect(mergeDecks(data, 'builtin', 'custom').merged).toBe(false)
    expect(mergeDecks(data, 'custom', 'builtin').merged).toBe(false)
  })

  it('удаляет пустую исходную колоду', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'source' }), makeDeck({ id: 'target' })],
      cards: [],
    })
    const result = mergeDecks(data, 'source', 'target')
    expect(result.merged).toBe(true)
    expect(result.cards).toBe(0)
    expect(result.data.decks.map((deck) => deck.id)).toEqual(['target'])
  })
})
