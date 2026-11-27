import { describe, expect, it } from 'vitest'
import {
  emptyTrash,
  pruneTrash,
  removeTrashEntry,
  restoreTrashEntry,
  trashCards,
  trashDeck,
} from './trash'
import type { TrashCardEntry, TrashEntry } from '../types'
import { makeCard, makeData, makeDeck } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()
const DAY = 86_400_000

function cardEntry(id: string, deletedAt: number): TrashCardEntry {
  return {
    id,
    kind: 'card',
    deletedAt,
    card: makeCard({ id, deckId: 'deck-1' }),
  }
}

describe('pruneTrash', () => {
  it('убирает записи старше срока хранения', () => {
    const entries: TrashEntry[] = [
      cardEntry('fresh', NOW - DAY),
      cardEntry('old', NOW - 3 * DAY),
    ]
    expect(pruneTrash(entries, NOW, 2).map((entry) => entry.id)).toEqual(['fresh'])
  })

  it('с нулевым сроком не удаляет ничего', () => {
    const entries = [cardEntry('ancient', NOW - 500 * DAY)]
    expect(pruneTrash(entries, NOW, 0)).toHaveLength(1)
  })

  it('убирает повторы, оставляя самую свежую запись', () => {
    const entries = [cardEntry('same', NOW - DAY), cardEntry('same', NOW - 2 * DAY)]
    const result = pruneTrash(entries, NOW, 10)
    expect(result).toHaveLength(1)
    expect(result[0].deletedAt).toBe(NOW - DAY)
  })
})

describe('trashCards', () => {
  it('переносит карточки в корзину, сохраняя прогресс', () => {
    const card = makeCard({ id: 'card-1', srs: { ...makeCard().srs, interval: 12 } })
    const data = makeData({ cards: [card] })

    const next = trashCards(data, ['card-1'])

    expect(next.cards).toHaveLength(0)
    expect(next.trash).toHaveLength(1)
    const entry = next.trash[0]
    expect(entry.kind).toBe('card')
    expect(entry.card.srs.interval).toBe(12)
  })

  it('заменяет старую запись при повторном удалении', () => {
    const data = makeData({
      cards: [makeCard({ id: 'card-1' })],
      trash: [cardEntry('card-1', NOW - DAY)],
    })

    const next = trashCards(data, ['card-1'])

    expect(next.trash).toHaveLength(1)
    expect(next.trash[0].deletedAt).toBeGreaterThan(NOW - DAY)
  })

  it('игнорирует неизвестные идентификаторы', () => {
    const data = makeData()
    expect(trashCards(data, ['missing'])).toBe(data)
  })

  it('сразу применяет срок хранения из настроек', () => {
    const data = makeData({
      settings: { ...makeData().settings, trashRetentionDays: 1 },
      trash: [cardEntry('old', NOW - 3 * DAY)],
      cards: [makeCard({ id: 'card-1' })],
    })

    const next = trashCards(data, ['card-1'])
    expect(next.trash.map((entry) => entry.id)).toEqual(['card-1'])
  })
})

describe('trashDeck', () => {
  it('переносит карточки колоды в корзину по одной', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'deck-1' })],
      cards: [
        makeCard({ id: 'card-1', deckId: 'deck-1' }),
        makeCard({ id: 'card-2', deckId: 'deck-1' }),
      ],
    })

    const next = trashDeck(data, 'deck-1')

    expect(next.decks).toHaveLength(0)
    expect(next.cards).toHaveLength(0)
    expect(next.trash.map((entry) => entry.id).sort()).toEqual(['card-1', 'card-2'])
    expect(next.trash.every((entry) => entry.kind === 'card')).toBe(true)
    expect(next.trash.map((entry) => entry.card.deckId)).toEqual(['deck-1', 'deck-1'])
  })

  it('сохраняет карточки, удалённые по одной раньше', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'deck-1' })],
      cards: [makeCard({ id: 'card-1', deckId: 'deck-1' })],
      trash: [cardEntry('card-2', Date.now() - DAY)],
    })

    const next = trashDeck(data, 'deck-1')

    expect(next.trash.map((entry) => entry.id).sort()).toEqual(['card-1', 'card-2'])
    expect(next.trash.every((entry) => entry.kind === 'card')).toBe(true)
  })

  it('не оставляет запись колоды, если карточек нет', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'deck-1' })],
      cards: [],
    })

    const next = trashDeck(data, 'deck-1')

    expect(next.decks).toHaveLength(0)
    expect(next.trash).toHaveLength(0)
  })

  it('ничего не делает с неизвестной колодой', () => {
    const data = makeData()
    expect(trashDeck(data, 'missing')).toBe(data)
  })
})

describe('restoreTrashEntry', () => {
  it('возвращает карточку в её колоду', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'deck-1' })],
      trash: [cardEntry('card-1', NOW)],
    })

    const result = restoreTrashEntry(data, 'card-1')

    expect(result.restored).toBe(true)
    expect(result.data.cards.map((card) => card.id)).toEqual(['card-1'])
    expect(result.data.cards[0].deckId).toBe('deck-1')
    expect(result.data.trash).toHaveLength(0)
  })

  it('не дублирует карточку, которая уже есть', () => {
    const card = makeCard({ id: 'card-1' })
    const data = makeData({
      cards: [card],
      trash: [{ ...cardEntry('card-1', NOW), card }],
    })

    const result = restoreTrashEntry(data, 'card-1')

    expect(result.restored).toBe(true)
    expect(result.data.cards).toHaveLength(1)
    expect(result.data.trash).toHaveLength(0)
  })

  it('не восстанавливает карточку без колоды и без выбора', () => {
    const data = makeData({ decks: [], cards: [], trash: [cardEntry('card-1', NOW)] })

    const result = restoreTrashEntry(data, 'card-1')

    expect(result.restored).toBe(false)
    expect(result.reason).toBe('deck-missing')
    expect(result.data.trash).toHaveLength(1)
  })

  it('возвращает карточку в выбранную колоду, если исходной нет', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'target' })],
      cards: [],
      trash: [cardEntry('card-1', NOW)],
    })

    const result = restoreTrashEntry(data, 'card-1', 'target')

    expect(result.restored).toBe(true)
    expect(result.data.cards[0].deckId).toBe('target')
    expect(result.data.trash).toHaveLength(0)
  })

  it('не восстанавливает в несуществующую колоду', () => {
    const data = makeData({
      decks: [makeDeck({ id: 'target' })],
      cards: [],
      trash: [cardEntry('card-1', NOW)],
    })

    const result = restoreTrashEntry(data, 'card-1', 'missing')

    expect(result.restored).toBe(false)
    expect(result.reason).toBe('deck-missing')
    expect(result.data.trash).toHaveLength(1)
  })

  it('возвращает false для неизвестной записи', () => {
    const data = makeData()
    expect(restoreTrashEntry(data, 'missing').restored).toBe(false)
  })
})

describe('удаление записей корзины', () => {
  it('удаляет одну запись', () => {
    const data = makeData({ trash: [cardEntry('card-1', NOW), cardEntry('card-2', NOW)] })
    const next = removeTrashEntry(data, 'card-1')
    expect(next.trash.map((entry) => entry.id)).toEqual(['card-2'])
  })

  it('очищает корзину целиком', () => {
    const data = makeData({ trash: [cardEntry('card-1', NOW)] })
    const next = emptyTrash(data)
    expect(next.trash).toHaveLength(0)
  })

  it('не пересоздаёт данные, если корзина уже пуста', () => {
    const data = makeData()
    expect(emptyTrash(data)).toBe(data)
  })
})
