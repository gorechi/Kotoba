import { describe, expect, it } from 'vitest'
import { cardSearchText, cardStatus } from './card-browser'
import type { Translate } from './i18n'
import { makeCard, makeSrs } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()
const t: Translate = (key) => key

describe('cardStatus', () => {
  it('определяет новую карточку', () => {
    expect(cardStatus(makeCard(), NOW)).toBe('new')
  })

  it('определяет просроченную карточку', () => {
    expect(
      cardStatus(makeCard({ srs: makeSrs({ introduced: true, due: NOW - 1, interval: 100 }) }), NOW),
    ).toBe('due')
  })

  it('определяет выученную карточку по интервалу', () => {
    expect(
      cardStatus(makeCard({ srs: makeSrs({ introduced: true, due: NOW + 1000, interval: 21 }) }), NOW),
    ).toBe('learned')
  })

  it('остальные карточки считает изучаемыми', () => {
    expect(
      cardStatus(makeCard({ srs: makeSrs({ introduced: true, due: NOW + 1000, interval: 20 }) }), NOW),
    ).toBe('learning')
  })
})

describe('cardSearchText', () => {
  it('собирает все поля карточки в нижнем регистре', () => {
    const card = makeCard({
      front: '食べる',
      reading: 'табэру',
      meaning: 'есть',
      note: 'заметка',
      mnemonic: 'мнемоника',
      tags: ['Еда', 'Глагол'],
      readings: [{ id: 'r1', kana: 'たべる', transcription: 'taberu' }],
      examples: [
        { id: 'e1', text: 'ご飯を食べる', transcription: 'гохан о табэру', translation: 'есть рис' },
      ],
    })

    const text = cardSearchText(card, t)
    for (const part of [
      '食べる',
      'табэру',
      'есть',
      'заметка',
      'мнемоника',
      'еда',
      'глагол',
      'たべる',
      'taberu',
      'ご飯を食べる',
      'есть рис',
    ]) {
      expect(text).toContain(part.toLowerCase())
    }
  })
})
