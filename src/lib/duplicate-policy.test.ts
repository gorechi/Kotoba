import { describe, expect, it } from 'vitest'
import { normalizeDuplicatePolicy } from './duplicate-policy'

describe('normalizeDuplicatePolicy', () => {
  it('по умолчанию спрашивает внутри колоды и игнорирует остальные', () => {
    expect(normalizeDuplicatePolicy(undefined)).toEqual({
      withinDeck: 'ask',
      acrossDecks: 'ignore',
    })
  })

  it('сохраняет корректные значения', () => {
    expect(
      normalizeDuplicatePolicy({
        withinDeck: 'deny',
        acrossDecks: 'ask',
      }),
    ).toEqual({ withinDeck: 'deny', acrossDecks: 'ask' })
  })

  it('заменяет мусор значениями по умолчанию', () => {
    expect(
      normalizeDuplicatePolicy({ withinDeck: 'maybe', acrossDecks: 42 }),
    ).toEqual({ withinDeck: 'ask', acrossDecks: 'ignore' })
  })

  it('переносит значения старой схемы', () => {
    expect(normalizeDuplicatePolicy(undefined, ['deny-deck', 'ask-all'])).toEqual({
      withinDeck: 'deny',
      acrossDecks: 'ask',
    })
    expect(normalizeDuplicatePolicy(undefined, ['ignore'])).toEqual({
      withinDeck: 'ignore',
      acrossDecks: 'ignore',
    })
  })

  it('переносит промежуточный вариант с общим отключением', () => {
    expect(normalizeDuplicatePolicy({ ignoreAll: true })).toEqual({
      withinDeck: 'ignore',
      acrossDecks: 'ignore',
    })
  })
})
