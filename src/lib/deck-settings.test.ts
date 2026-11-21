import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DECK_SETTINGS,
  effectiveStudyMode,
  getDeckSettings,
  orderNewCards,
  remainingNewForDeck,
  remainingReviewForDeck,
  sessionSizeForDeck,
  usedNewForDeck,
  usedReviewsForDeck,
} from './deck-settings'
import { makeCard, makeDayStat, makeDeck, makeDeckSettings, makeSettings } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()

describe('getDeckSettings', () => {
  it('возвращает настройки колоды или значения по умолчанию', () => {
    expect(getDeckSettings(makeDeck())).toEqual(DEFAULT_DECK_SETTINGS)
    const settings = makeDeckSettings({ newPerDay: 5 })
    expect(getDeckSettings(makeDeck({ settings }))).toBe(settings)
  })
})

describe('effectiveStudyMode', () => {
  it('берёт глобальный режим, если колода его не переопределяет', () => {
    expect(effectiveStudyMode(undefined, 'writing')).toBe('writing')
    expect(effectiveStudyMode(makeDeck(), 'writing')).toBe('writing')
  })

  it('уважает режим колоды', () => {
    const deck = makeDeck({ settings: makeDeckSettings({ studyMode: 'reading' }) })
    expect(effectiveStudyMode(deck, 'writing')).toBe('reading')
  })
})

describe('sessionSizeForDeck', () => {
  it('использует размер колоды, если он задан', () => {
    const deck = makeDeck({ settings: makeDeckSettings({ sessionSize: 20 }) })
    expect(sessionSizeForDeck(deck, makeSettings({ sessionSize: 50 }))).toBe(20)
  })

  it('падает обратно на глобальный размер', () => {
    expect(sessionSizeForDeck(makeDeck(), makeSettings({ sessionSize: 50 }))).toBe(50)
    expect(sessionSizeForDeck(undefined, makeSettings({ sessionSize: 15 }))).toBe(15)
  })
})

describe('счётчики дня по колоде', () => {
  const history = {
    '2026-01-15': makeDayStat({
      newByDeck: { deck: 3 },
      reviewByDeck: { deck: 7 },
    }),
  }

  it('читает использованные новые и повторения', () => {
    expect(usedNewForDeck(history, 'deck', NOW)).toBe(3)
    expect(usedReviewsForDeck(history, 'deck', NOW)).toBe(7)
    expect(usedNewForDeck(history, 'other', NOW)).toBe(0)
  })

  it('учитывает начало учебного дня', () => {
    const lateNight = new Date(2026, 0, 16, 2, 0, 0).getTime()
    expect(usedNewForDeck(history, 'deck', lateNight, 3)).toBe(3)
    expect(usedNewForDeck(history, 'deck', lateNight, 0)).toBe(0)
  })
})

describe('remainingNewForDeck', () => {
  it('считает остаток по лимиту колоды', () => {
    const deck = makeDeck({
      settings: makeDeckSettings({ newPerDay: 10 }),
    })
    const history = { '2026-01-15': makeDayStat({ newByDeck: { 'deck-1': 4 } }) }
    expect(remainingNewForDeck(history, deck, makeSettings(), NOW)).toBe(6)
  })

  it('не уходит в минус и учитывает запрет новых', () => {
    const history = { '2026-01-15': makeDayStat({ newByDeck: { 'deck-1': 99 } }) }
    expect(remainingNewForDeck(history, makeDeck(), makeSettings(), NOW)).toBe(0)

    const disabled = makeDeck({ settings: makeDeckSettings({ allowNew: false }) })
    expect(remainingNewForDeck({}, disabled, makeSettings(), NOW)).toBe(0)
  })

  it('использует глобальный лимит, если у колоды своего нет', () => {
    const history = { '2026-01-15': makeDayStat({ newByDeck: { 'deck-1': 2 } }) }
    expect(
      remainingNewForDeck(history, makeDeck(), makeSettings({ newPerDay: 7 }), NOW),
    ).toBe(5)
  })
})

describe('remainingReviewForDeck', () => {
  it('без лимита возвращает бесконечность', () => {
    expect(remainingReviewForDeck({}, makeDeck(), NOW)).toBe(Number.POSITIVE_INFINITY)
  })

  it('считает остаток повторений', () => {
    const deck = makeDeck({ settings: makeDeckSettings({ reviewLimit: 20 }) })
    const history = { '2026-01-15': makeDayStat({ reviewByDeck: { 'deck-1': 8 } }) }
    expect(remainingReviewForDeck(history, deck, NOW)).toBe(12)
  })
})

describe('orderNewCards', () => {
  const cards = [
    makeCard({ id: 'a', order: 3, frequency: 100, jlpt: 5 }),
    makeCard({ id: 'b', order: 1, frequency: 20, jlpt: 4 }),
    makeCard({ id: 'c', order: 2, frequency: undefined, jlpt: undefined }),
  ]

  it('сортирует по порядку', () => {
    expect(orderNewCards(cards, 'order').map((card) => card.id)).toEqual(['b', 'c', 'a'])
  })

  it('сортирует по частоте, отсутствие значения — в конец', () => {
    expect(orderNewCards(cards, 'frequency').map((card) => card.id)).toEqual([
      'b',
      'a',
      'c',
    ])
  })

  it('сортирует по JLPT от N5 к N1', () => {
    expect(orderNewCards(cards, 'jlpt').map((card) => card.id)).toEqual(['a', 'b', 'c'])
  })

  it('перемешивает, не теряя карточек', () => {
    const ids = orderNewCards(cards, 'random').map((card) => card.id)
    expect([...ids].sort()).toEqual(['a', 'b', 'c'])
  })

  it('не меняет исходный массив', () => {
    orderNewCards(cards, 'order')
    expect(cards.map((card) => card.id)).toEqual(['a', 'b', 'c'])
  })
})
