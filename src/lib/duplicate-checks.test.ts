import { describe, expect, it } from 'vitest'
import { normalizeDuplicateChecks, toggleDuplicateCheck } from './duplicate-checks'

describe('normalizeDuplicateChecks', () => {
  it('по умолчанию игнорирует дубликаты', () => {
    expect(normalizeDuplicateChecks(undefined)).toEqual(['ignore'])
    expect(normalizeDuplicateChecks([])).toEqual(['ignore'])
    expect(normalizeDuplicateChecks(['nonsense'])).toEqual(['ignore'])
  })

  it('оставляет только корректные значения', () => {
    expect(normalizeDuplicateChecks(['ask-deck', 'nonsense'])).toEqual(['ask-deck'])
  })

  it('не оставляет взаимоисключающие пары', () => {
    expect(normalizeDuplicateChecks(['ask-deck', 'deny-deck'])).toEqual(['ask-deck'])
    expect(normalizeDuplicateChecks(['deny-all', 'ask-all'])).toEqual(['deny-all'])
  })

  it('вариант «не обращать внимания» отменяет остальные', () => {
    expect(normalizeDuplicateChecks(['ask-deck', 'ignore', 'deny-all'])).toEqual(['ignore'])
  })
})

describe('toggleDuplicateCheck', () => {
  it('выключение убирает только выбранный вариант', () => {
    expect(toggleDuplicateCheck(['ask-deck', 'ask-all'], 'ask-deck', false)).toEqual([
      'ask-all',
    ])
  })

  it('включение «не обращать внимания» сбрасывает остальные', () => {
    expect(toggleDuplicateCheck(['ask-deck', 'deny-all'], 'ignore', true)).toEqual(['ignore'])
  })

  it('снимает противоположный вариант внутри пары', () => {
    expect(toggleDuplicateCheck(['ask-deck'], 'deny-deck', true)).toEqual(['deny-deck'])
    expect(toggleDuplicateCheck(['deny-all'], 'ask-all', true)).toEqual(['ask-all'])
  })

  it('позволяет отметить варианты из разных пар', () => {
    expect(toggleDuplicateCheck(['ask-deck'], 'ask-all', true)).toEqual([
      'ask-deck',
      'ask-all',
    ])
  })
})
