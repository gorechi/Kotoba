import { describe, expect, it } from 'vitest'
import {
  cardExampleTranslation,
  cardMeaning,
  cardNote,
  cardSpeakText,
  deckDescription,
  deckTitle,
} from './content'
import type { Translate } from './i18n'
import { makeCard, makeDeck } from '../test/factories'

function translator(overrides: Record<string, string> = {}): Translate {
  return (key) => overrides[key] ?? key
}

describe('deckTitle', () => {
  it('отдаёт приоритет своему названию', () => {
    const deck = makeDeck({ name: 'Моя колода', builtin: true })
    expect(deckTitle(deck, translator())).toBe('Моя колода')
  })

  it('берёт локализованное название встроенной колоды', () => {
    const deck = makeDeck({ name: '', builtin: true, id: 'hiragana' })
    expect(deckTitle(deck, translator({ 'deck.hiragana.name': 'Хирагана' }))).toBe(
      'Хирагана',
    )
  })

  it('возвращает заглушку для колоды без названия', () => {
    const deck = makeDeck({ name: '' })
    expect(deckTitle(deck, translator({ 'common.untitled': 'Без названия' }))).toBe(
      'Без названия',
    )
  })

  it('возвращает заглушку сессии для отсутствующей колоды', () => {
    expect(deckTitle(undefined, translator({ 'session.deckFallback': 'Колода' }))).toBe(
      'Колода',
    )
  })
})

describe('deckDescription', () => {
  it('отдаёт приоритет своему описанию', () => {
    const deck = makeDeck({ description: 'Своё', builtin: true })
    expect(deckDescription(deck, translator())).toBe('Своё')
  })

  it('берёт описание встроенной колоды из локали', () => {
    const deck = makeDeck({ description: '', builtin: true, id: 'hiragana' })
    expect(
      deckDescription(deck, translator({ 'deck.hiragana.description': 'Японская азбука' })),
    ).toBe('Японская азбука')
  })

  it('возвращает пустую строку, если описания нет', () => {
    expect(deckDescription(makeDeck({ description: '' }), translator())).toBe('')
  })
})

describe('cardMeaning', () => {
  it('отдаёт приоритет своему значению', () => {
    expect(cardMeaning(makeCard({ meaning: 'своё' }), translator())).toBe('своё')
  })

  it('берёт значение встроенной карточки кандзи', () => {
    const card = makeCard({ id: 'kanji-n5-001', meaning: '' })
    expect(cardMeaning(card, translator({ 'kanji.n5.001.meaning': 'есть' }))).toBe('есть')
  })

  it('возвращает пустую строку, если значения нет', () => {
    expect(cardMeaning(makeCard({ id: 'custom', meaning: '' }), translator())).toBe('')
  })
})

describe('cardExampleTranslation', () => {
  it('отдаёт приоритет своему переводу', () => {
    const card = makeCard()
    const example = {
      id: 'example-001-1',
      text: 'ご飯',
      transcription: 'гохан',
      translation: 'рис',
    }
    expect(cardExampleTranslation(card, example, translator())).toBe('рис')
  })

  it('берёт перевод встроенного примера', () => {
    const card = makeCard({ id: 'kanji-n5-001' })
    const example = {
      id: 'example-001-1',
      text: 'ご飯',
      transcription: 'гохан',
      translation: '',
    }
    expect(
      cardExampleTranslation(card, example, translator({ 'kanji.n5.001.example.1': 'еда' })),
    ).toBe('еда')
  })

  it('возвращает пустую строку для неизвестного примера', () => {
    const example = { id: 'other', text: '', transcription: '', translation: '' }
    expect(cardExampleTranslation(makeCard(), example, translator())).toBe('')
  })
})

describe('cardSpeakText', () => {
  it('для кандзи произносит первое чтение каной', () => {
    const card = makeCard({
      front: '水',
      readings: [{ id: 'reading-1', kana: 'みず', transcription: 'mizu' }],
    })
    expect(cardSpeakText(card)).toBe('みず')
  })

  it('без чтения произносит само написание', () => {
    expect(cardSpeakText(makeCard({ front: 'かな' }))).toBe('かな')
  })
})

describe('cardNote', () => {
  it('возвращает свою заметку для пользовательской колоды', () => {
    const card = makeCard({ note: 'заметка' })
    expect(cardNote(card, makeDeck(), translator())).toBe('заметка')
  })

  it('собирает заметку встроенной азбуки из локали', () => {
    const deck = makeDeck({ builtin: true, kind: 'kana' })
    const card = makeCard({ front: 'あ', note: 'игнорируется' })
    expect(
      cardNote(card, deck, translator({ 'kana.note.あ': 'Первая буква' })),
    ).toBe('Первая буква')
  })
})
