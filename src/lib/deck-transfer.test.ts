import { describe, expect, it } from 'vitest'
import {
  createDeckTransfer,
  importDeckTransfer,
  parseDeckTransfer,
} from './deck-transfer'
import { makeCard, makeData, makeDeck, makeSrs } from '../test/factories'

describe('createDeckTransfer', () => {
  it('собирает файл колоды без прогресса и сбрасывает признак встроенной', () => {
    const file = createDeckTransfer(
      makeDeck({ id: 'deck-1', name: 'Еда', builtin: true }),
      [makeCard({ id: 'card-1', deckId: 'deck-1', srs: makeSrs({ interval: 10 }) })],
    )

    expect(file.format).toBe('kotoba-deck')
    expect(file.version).toBe(1)
    expect(file.deck.builtin).toBe(false)
    expect(file.deck.name).toBe('Еда')
    expect(file.cards).toHaveLength(1)
    expect('srs' in file.cards[0]).toBe(false)
  })

  it('позволяет переименовать колоду при экспорте', () => {
    const file = createDeckTransfer(makeDeck({ name: 'Старое' }), [], 'Новое')
    expect(file.deck.name).toBe('Новое')
  })
})

describe('parseDeckTransfer', () => {
  it('читает формат отдельной колоды', () => {
    const parsed = parseDeckTransfer({
      format: 'kotoba-deck',
      version: 1,
      deck: makeDeck({ id: 'deck-1', name: 'Еда' }),
      cards: [makeCard({ id: 'card-1', deckId: 'deck-1' })],
    })

    expect(parsed?.deck.id).toBe('deck-1')
    expect(parsed?.deck.builtin).toBe(false)
    expect(parsed?.cards.map((card) => card.id)).toEqual(['card-1'])
  })

  it('принимает полную копию с одной колодой', () => {
    const parsed = parseDeckTransfer({
      version: 2,
      decks: [makeDeck({ id: 'deck-1' })],
      cards: [makeCard({ id: 'card-1', deckId: 'deck-1' })],
    })
    expect(parsed?.deck.id).toBe('deck-1')
  })

  it('отклоняет копию с несколькими колодами и мусор', () => {
    expect(
      parseDeckTransfer({
        decks: [makeDeck({ id: 'a' }), makeDeck({ id: 'b' })],
        cards: [],
      }),
    ).toBeNull()
    expect(parseDeckTransfer(null)).toBeNull()
    expect(parseDeckTransfer({})).toBeNull()
  })
})

describe('importDeckTransfer', () => {
  it('добавляет колоду с новыми идентификаторами и свежим прогрессом', () => {
    const current = makeData({ decks: [makeDeck({ id: 'existing' })], cards: [] })
    const parsed = {
      deck: makeDeck({ id: 'deck-1', name: 'Еда' }),
      cards: [
        makeCard({ id: 'card-1', deckId: 'deck-1', order: 50, srs: makeSrs({ interval: 99 }) }),
        makeCard({ id: 'card-2', deckId: 'deck-1', order: 60 }),
      ],
    }

    const result = importDeckTransfer(current, parsed)

    expect(result.data.decks).toHaveLength(2)
    const imported = result.data.decks.find((deck) => deck.id === result.deckId)
    expect(imported?.name).toBe('Еда')
    expect(imported?.builtin).toBe(false)

    const importedCards = result.data.cards.filter((card) => card.deckId === result.deckId)
    expect(importedCards).toHaveLength(2)
    expect(importedCards.map((card) => card.order)).toEqual([1, 2])
    expect(importedCards.every((card) => card.srs.interval === 0)).toBe(true)
    expect(importedCards.some((card) => card.id === 'card-1')).toBe(false)
  })

  it('добавляет суффикс к совпадающему названию', () => {
    const current = makeData({ decks: [makeDeck({ name: 'Еда' })] })
    const result = importDeckTransfer(current, { deck: makeDeck({ name: 'Еда' }), cards: [] })
    const imported = result.data.decks.find((deck) => deck.id === result.deckId)
    expect(imported?.name).toBe('Еда (2)')
  })
})
