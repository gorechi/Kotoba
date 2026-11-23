import { describe, expect, it } from 'vitest'
import { normalizeDuplicateAction } from './duplicate-action'

describe('normalizeDuplicateAction', () => {
  it('по умолчанию спрашивает', () => {
    expect(normalizeDuplicateAction(undefined)).toBe('ask')
  })

  it('сохраняет корректное значение', () => {
    expect(normalizeDuplicateAction('deny')).toBe('deny')
    expect(normalizeDuplicateAction('ignore')).toBe('ignore')
  })

  it('заменяет неизвестное значение на «спрашивать»', () => {
    expect(normalizeDuplicateAction('maybe')).toBe('ask')
  })

  it('переносит промежуточную схему с двумя колонками', () => {
    expect(
      normalizeDuplicateAction(undefined, { withinDeck: 'deny', acrossDecks: 'ignore' }),
    ).toBe('deny')
    expect(
      normalizeDuplicateAction(undefined, { ignoreAll: true, withinDeck: 'ask' }),
    ).toBe('ignore')
  })

  it('переносит старую схему с набором вариантов', () => {
    expect(normalizeDuplicateAction(undefined, undefined, ['ask-deck'])).toBe('ask')
    expect(normalizeDuplicateAction(undefined, undefined, ['deny-all'])).toBe('deny')
    expect(normalizeDuplicateAction(undefined, undefined, ['ignore'])).toBe('ignore')
  })
})
