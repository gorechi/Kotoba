import { describe, expect, it } from 'vitest'
import { applyBackup, inspectBackup } from './backup'
import { makeCard, makeData, makeDeck } from '../test/factories'

const backup = {
  version: 2,
  decks: [makeDeck({ id: 'custom', name: 'Своя', builtin: false })],
  cards: [makeCard({ id: 'card-1', deckId: 'custom' })],
}

describe('inspectBackup', () => {
  it('отклоняет не объект', () => {
    expect(inspectBackup(null)).toMatchObject({ ok: false, error: 'not-object' })
    expect(inspectBackup('файл')).toMatchObject({ ok: false, error: 'not-object' })
  })

  it('отклоняет неизвестную версию', () => {
    expect(inspectBackup({ version: 99, decks: [], cards: [] })).toMatchObject({
      ok: false,
      error: 'unsupported-version',
    })
  })

  it('требует массивы колод и карточек', () => {
    expect(inspectBackup({})).toMatchObject({ ok: false, error: 'missing-decks' })
    expect(inspectBackup({ decks: [] })).toMatchObject({ ok: false, error: 'missing-cards' })
  })

  it('отклоняет файл без валидных колод', () => {
    expect(inspectBackup({ decks: [{}], cards: [] })).toMatchObject({
      ok: false,
      error: 'no-valid-decks',
    })
  })

  it('принимает копию и считает колоды и карточки', () => {
    const result = inspectBackup(backup)
    expect(result.ok).toBe(true)
    expect(result.decks).toBe(1)
    expect(result.cards).toBe(1)
    expect(result.customDecks).toBe(1)
    expect(result.builtinDecks).toBe(0)
  })

  it('считает пропущенные записи', () => {
    const result = inspectBackup({
      ...backup,
      decks: [...backup.decks, {}],
      cards: [...backup.cards, { id: 'broken' }],
    })
    expect(result.ok).toBe(true)
    expect(result.skippedDecks).toBe(1)
    expect(result.skippedCards).toBe(1)
  })

  it('принимает легаси-файл без версии', () => {
    const result = inspectBackup({ decks: backup.decks, cards: backup.cards })
    expect(result.ok).toBe(true)
  })
})

describe('applyBackup', () => {
  it('в режиме замены добавляет встроенные колоды', () => {
    const current = makeData()
    const next = applyBackup(current, backup, 'replace')

    expect(next.decks.map((deck) => deck.id)).toContain('custom')
    expect(next.decks.map((deck) => deck.id)).toContain('hiragana')
    expect(next.cards.map((card) => card.id)).toContain('card-1')
  })

  it('в режиме объединения добавляет только пользовательские колоды', () => {
    const current = makeData({
      decks: [makeDeck({ id: 'existing', name: 'Старая' })],
      cards: [],
    })
    const next = applyBackup(current, backup, 'merge')

    expect(next.decks.map((deck) => deck.name)).toContain('Старая')
    expect(next.decks.map((deck) => deck.name)).toContain('Своя')
    expect(next.cards.some((card) => card.id === 'card-1')).toBe(true)
  })

  it('в режиме объединения не дублирует идентификаторы', () => {
    const current = makeData({
      decks: [makeDeck({ id: 'custom', name: 'Моя' })],
      cards: [makeCard({ id: 'card-1', deckId: 'custom' })],
    })
    const next = applyBackup(current, backup, 'merge')

    expect(next.decks).toHaveLength(2)
    expect(new Set(next.decks.map((deck) => deck.id)).size).toBe(2)
    expect(next.cards).toHaveLength(2)
    expect(new Set(next.cards.map((card) => card.id)).size).toBe(2)
  })

  it('в режиме объединения пропускает встроенные колоды из файла', () => {
    const current = makeData({ decks: [], cards: [] })
    const next = applyBackup(
      current,
      {
        ...backup,
        decks: [makeDeck({ id: 'builtin', name: 'Встроенная', builtin: true })],
        cards: [],
      },
      'merge',
    )
    expect(next.decks).toHaveLength(0)
  })
})
