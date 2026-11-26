import { describe, expect, it } from 'vitest'
import { messages as en } from '../locales/ui/en'
import { TOUR_STEPS, TOUR_TOTAL } from './tour'

describe('маршрут тура', () => {
  it('ведёт по всем разделам меню по порядку', () => {
    expect(TOUR_STEPS.map((step) => step.nav)).toEqual([
      'home',
      'decks',
      'kanji',
      'cards',
      'problems',
      'kanamap',
      'stats',
      'data',
      'zen',
      'settings',
      'help',
    ])
  })

  it('включает приветствие и финальный экран в общее число шагов', () => {
    expect(TOUR_TOTAL).toBe(TOUR_STEPS.length + 1)
    expect(TOUR_TOTAL).toBe(12)
  })

  it('не открывает Дзен и подсвечивает для него только меню', () => {
    const zen = TOUR_STEPS.find((step) => step.id === 'zen')
    expect(zen?.route).toBeUndefined()
    expect(zen?.content).toBe(false)
  })

  it('содержит заголовок и текст для каждого шага', () => {
    for (const step of TOUR_STEPS) {
      expect(step.titleKey).toMatch(/^tour\./)
      expect(step.textKey).toMatch(/^tour\./)
      expect(en[step.titleKey]).toBeTruthy()
      expect(en[step.textKey]).toBeTruthy()
    }
  })
})
