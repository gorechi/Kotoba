import { describe, expect, it } from 'vitest'
import { normalizeDuplicatePolicy } from './duplicate-policy'

describe('normalizeDuplicatePolicy', () => {
  it('по умолчанию спрашивает внутри колоды и игнорирует остальные', () => {
    expect(normalizeDuplicatePolicy(undefined)).toEqual({
      ignoreAll: false,
      withinDeck: 'ask',
      acrossDecks: 'ignore',
    })
  })

  it('сохраняет корректные значения', () => {
    expect(
      normalizeDuplicatePolicy({
        ignoreAll: true,
        withinDeck: 'deny',
        acrossDecks: 'ask',
      }),
    ).toEqual({ ignoreAll: true, withinDeck: 'deny', acrossDecks: 'ask' })
  })

  it('заменяет мусор значениями по умолчанию', () => {
    expect(
      normalizeDuplicatePolicy({ ignoreAll: 'yes', withinDeck: 'maybe', acrossDecks: 42 }),
    ).toEqual({ ignoreAll: false, withinDeck: 'ask', acrossDecks: 'ignore' })
  })

  it('переносит значения старой схемы', () => {
    expect(normalizeDuplicatePolicy(undefined, ['deny-deck', 'ask-all'])).toEqual({
      ignoreAll: false,
      withinDeck: 'deny',
      acrossDecks: 'ask',
    })
    expect(normalizeDuplicatePolicy(undefined, ['ignore'])).toEqual({
      ignoreAll: true,
      withinDeck: 'ask',
      acrossDecks: 'ignore',
    })
  })
})
