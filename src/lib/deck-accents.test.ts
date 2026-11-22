import { describe, expect, it } from 'vitest'
import { DECK_ACCENTS, DEFAULT_DECK_ACCENT } from './deck-accents'

describe('DECK_ACCENTS', () => {
  it('содержит не меньше двенадцати цветов', () => {
    expect(DECK_ACCENTS.length).toBeGreaterThanOrEqual(12)
  })

  it('не повторяет цвета', () => {
    expect(new Set(DECK_ACCENTS).size).toBe(DECK_ACCENTS.length)
  })

  it('использует формат #RRGGBB', () => {
    for (const color of DECK_ACCENTS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('начинается со стандартного акцента', () => {
    expect(DEFAULT_DECK_ACCENT).toBe(DECK_ACCENTS[0])
    expect(DEFAULT_DECK_ACCENT).toBe('#E1523D')
  })
})
