import { describe, expect, it } from 'vitest'
import {
  buildTextMarks,
  cardsForTextSearch,
  mergeTextMarks,
  sameMarks,
} from './text-marks'
import { makeCard, makeDeck } from '../test/factories'

describe('cardsForTextSearch', () => {
  it('исключает стандартные хирагану и катакану, но оставляет кандзи и свои колоды', () => {
    const decks = [
      makeDeck({ id: 'hiragana', builtin: true, kind: 'kana' }),
      makeDeck({ id: 'katakana', builtin: true, kind: 'kana' }),
      makeDeck({ id: 'kanji', builtin: true, kind: 'kanji' }),
      makeDeck({ id: 'custom', builtin: false, kind: 'kana' }),
    ]
    const cards = [
      makeCard({ id: 'hira', deckId: 'hiragana' }),
      makeCard({ id: 'kata', deckId: 'katakana' }),
      makeCard({ id: 'kanji', deckId: 'kanji' }),
      makeCard({ id: 'custom', deckId: 'custom' }),
    ]

    expect(cardsForTextSearch(cards, decks).map((card) => card.id)).toEqual([
      'kanji',
      'custom',
    ])
  })
})

describe('buildTextMarks', () => {
  it('находит все вхождения и группирует карточки с одинаковым написанием', () => {
    const cards = [
      makeCard({ id: 'card-1', front: 'はい' }),
      makeCard({ id: 'card-2', front: 'はい' }),
    ]

    const marks = buildTextMarks('はい、はい', cards)

    expect(marks).toHaveLength(2)
    expect(marks[0]).toMatchObject({ start: 0, end: 2, cardIds: ['card-1', 'card-2'] })
    expect(marks[1]).toMatchObject({ start: 3, end: 5, cardIds: ['card-1', 'card-2'] })
  })

  it('предпочитает более длинную фразу', () => {
    const cards = [
      makeCard({ id: 'japan', front: '日本' }),
      makeCard({ id: 'japanese', front: '日本語' }),
    ]

    const marks = buildTextMarks('日本語', cards)

    expect(marks).toEqual([{ start: 0, end: 3, cardIds: ['japanese'] }])
  })

  it('возвращает пустой список без совпадений или карточек', () => {
    expect(buildTextMarks('こんにちは', [])).toEqual([])
    expect(buildTextMarks('こんにちは', [makeCard({ front: 'はい' })])).toEqual([])
  })
})

describe('mergeTextMarks', () => {
  it('ручная пометка важнее перекрывающейся автоматической', () => {
    const automatic = [{ start: 0, end: 3, cardIds: ['phrase'] }]
    const manual = [{ start: 0, end: 1, cardIds: ['word'], manual: true }]

    expect(mergeTextMarks(automatic, manual)).toEqual(manual)
  })

  it('оставляет автоматические пометки вне ручных', () => {
    const automatic = [
      { start: 0, end: 2, cardIds: ['first'] },
      { start: 3, end: 5, cardIds: ['second'] },
      { start: 6, end: 8, cardIds: ['third'] },
    ]
    const manual = [{ start: 1, end: 4, cardIds: ['manual'], manual: true }]

    expect(mergeTextMarks(automatic, manual)).toEqual([
      manual[0],
      { start: 6, end: 8, cardIds: ['third'] },
    ])
  })
})

describe('sameMarks', () => {
  it('сравнивает границы, карточки и признак ручной пометки', () => {
    const mark = { start: 0, end: 2, cardIds: ['card-1'] }
    expect(sameMarks([mark], [{ ...mark }])).toBe(true)
    expect(sameMarks([mark], [{ ...mark, manual: true }])).toBe(false)
    expect(sameMarks([mark], [{ ...mark, end: 3 }])).toBe(false)
  })
})
