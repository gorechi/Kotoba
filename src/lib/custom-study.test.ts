import { describe, expect, it } from 'vitest'
import { buildCustomStudyQueue, presetOptions } from './custom-study'
import type { CustomStudyOptions } from '../types'
import { makeCard, makeData, makeDeck, makeSrs } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()
const DAY = 86_400_000

const decks = [
  makeDeck({ id: 'kana', kind: 'kana' }),
  makeDeck({ id: 'kanji', kind: 'kanji' }),
]

const cards = [
  makeCard({ id: 'hira', deckId: 'kana', front: 'ひらがな', script: 'hiragana', order: 1 }),
  makeCard({ id: 'kata', deckId: 'kana', front: 'カタカナ', script: 'katakana', order: 2 }),
  makeCard({ id: 'mixed', deckId: 'kana', front: 'ひらがなとカタカナ', script: 'mixed', order: 3 }),
  makeCard({
    id: 'no-script',
    deckId: 'kana',
    front: 'ひみつ',
    order: 4,
  }),
  makeCard({ id: 'kanji', deckId: 'kanji', front: '食', script: undefined, order: 5 }),
  makeCard({ id: 'suspended', deckId: 'kana', suspended: true, order: 6 }),
  makeCard({
    id: 'due',
    deckId: 'kana',
    order: 7,
    srs: makeSrs({ introduced: true, due: NOW - DAY, interval: 4 }),
  }),
  makeCard({
    id: 'mistake',
    deckId: 'kana',
    order: 8,
    srs: makeSrs({ introduced: true, due: NOW + DAY, lastMistakeAt: NOW - 2 * DAY }),
  }),
  makeCard({
    id: 'problem',
    deckId: 'kana',
    order: 9,
    tags: ['еда'],
    srs: makeSrs({ introduced: true, due: NOW + DAY, lapses: 2, interval: 30 }),
  }),
]

const data = makeData({ decks, cards })

function queue(options: Partial<CustomStudyOptions> = {}) {
  const result = buildCustomStudyQueue(
    data.cards,
    data.decks,
    { deckId: 'all', status: 'all', kind: 'all', limit: 0, ...options },
    NOW,
  )
  return result.map((item) => item.cardId)
}

describe('buildCustomStudyQueue', () => {
  it('по умолчанию берёт все неудалённые и неотложенные карточки', () => {
    const ids = queue()
    expect(ids).toContain('hira')
    expect(ids).toContain('kanji')
    expect(ids).not.toContain('suspended')
  })

  it('фильтрует по колоде', () => {
    expect(queue({ deckId: 'kanji' })).toEqual(['kanji'])
  })

  it('фильтрует по типу', () => {
    expect(queue({ kind: 'kanji' })).toEqual(['kanji'])
    expect(queue({ kind: 'kana' })).not.toContain('kanji')
  })

  it('фильтрует новые, просроченные и ошибки', () => {
    expect(queue({ status: 'new' })).toEqual(
      expect.arrayContaining(['hira', 'kata', 'mixed', 'no-script']),
    )
    expect(queue({ status: 'new' })).not.toContain('due')
    expect(queue({ status: 'overdue' })).toEqual(['due'])
    expect(queue({ status: 'mistakes' })).toEqual(['mistake'])
  })

  it('находит проблемные карточки', () => {
    const ids = queue({ status: 'problems' })
    expect(ids).toContain('problem')
    expect(ids).toContain('mistake')
    expect(ids).not.toContain('hira')
  })

  it('фильтрует по тегу', () => {
    expect(queue({ tag: 'еда' })).toEqual(['problem'])
  })

  it('фильтрует по письменности', () => {
    expect(queue({ script: 'hiragana' })).toEqual(
      expect.arrayContaining(['hira', 'no-script']),
    )
    expect(queue({ script: 'hiragana' })).not.toContain('kata')
    expect(queue({ script: 'hiragana' })).not.toContain('mixed')
    expect(queue({ script: 'katakana' })).toEqual(['kata'])
  })

  it('не применяет письменность к типу «кандзи»', () => {
    expect(queue({ kind: 'kanji', script: 'hiragana' })).toEqual(['kanji'])
  })

  it('ограничивает размер набора', () => {
    expect(queue({ limit: 2 })).toHaveLength(2)
  })

  it('сортирует по колодам и порядку', () => {
    const ids = queue({ order: 'deck' })
    const kanjiIndex = ids.indexOf('kanji')
    expect(kanjiIndex).toBeGreaterThan(ids.indexOf('hira'))
  })
})

describe('presetOptions', () => {
  it('собирает готовые наборы', () => {
    expect(presetOptions('overdue')).toMatchObject({ status: 'overdue', limit: 0 })
    expect(presetOptions('new')).toMatchObject({ status: 'new', limit: 0 })
    expect(presetOptions('jlpt5')).toMatchObject({ jlpt: 5, limit: 50 })
    expect(presetOptions('kanji')).toMatchObject({ kind: 'kanji', limit: 50 })
    expect(presetOptions('problems')).toMatchObject({ status: 'problems', limit: 0 })
    expect(presetOptions('mistakes')).toMatchObject({ status: 'mistakes', limit: 50 })
  })
})
