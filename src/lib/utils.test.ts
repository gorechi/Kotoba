import { describe, expect, it } from 'vitest'
import { dayKey, dueLabel, formatDate, formatDuration, shuffle, uid } from './utils'

describe('dayKey', () => {
  it('возвращает локальную дату', () => {
    expect(dayKey(new Date(2026, 0, 15, 12, 0, 0).getTime())).toBe('2026-01-15')
  })

  it('сдвигает границу дня по настройке учебного дня', () => {
    const early = new Date(2026, 0, 15, 2, 0, 0).getTime()
    expect(dayKey(early, 0)).toBe('2026-01-15')
    expect(dayKey(early, 3)).toBe('2026-01-14')

    const noon = new Date(2026, 0, 15, 12, 0, 0).getTime()
    expect(dayKey(noon, 3)).toBe('2026-01-15')
  })

  it('переносит новогоднюю ночь в прошлый год', () => {
    const newYear = new Date(2026, 0, 1, 1, 0, 0).getTime()
    expect(dayKey(newYear, 3)).toBe('2025-12-31')
  })
})

describe('shuffle', () => {
  it('не меняет исходный массив и сохраняет элементы', () => {
    const source = [1, 2, 3, 4, 5]
    const result = shuffle(source)
    expect(source).toEqual([1, 2, 3, 4, 5])
    expect(result).not.toBe(source)
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('uid', () => {
  it('добавляет префикс и даёт разные значения', () => {
    const first = uid('card')
    const second = uid('card')
    expect(first.startsWith('card-')).toBe(true)
    expect(first).not.toBe(second)
  })
})

describe('formatDate', () => {
  it('возвращает дату с заглавной буквы', () => {
    const text = formatDate(new Date(2026, 0, 15, 12).getTime())
    expect(text).toContain('January')
    expect(text[0]).toBe(text[0].toUpperCase())
  })
})

describe('dueLabel', () => {
  const now = new Date(2026, 0, 15, 12, 0, 0).getTime()

  it('различает новую карточку и уже наступившее повторение', () => {
    expect(dueLabel(now + 1000, false, now)).toBe('new')
    expect(dueLabel(now - 1000, true, now)).toBe('due')
  })

  it('показывает минуты, часы и дни', () => {
    expect(dueLabel(now + 5 * 60_000, true, now)).toBe('in 5 min')
    expect(dueLabel(now + 2 * 3_600_000, true, now)).toBe('in 2 h')
    expect(dueLabel(now + 3 * 86_400_000, true, now)).toBe('in 3 days')
  })

  it('использует «завтра» для следующего дня', () => {
    expect(dueLabel(now + 86_400_000, true, now)).toBe('tomorrow')
  })

  it('переходит на месяцы для далёких повторений', () => {
    expect(dueLabel(now + 45 * 86_400_000, true, now)).toBe('in 2 mo')
  })
})

describe('formatDuration', () => {
  it('форматирует секунды и минуты', () => {
    expect(formatDuration(5000)).toBe('5 s')
    expect(formatDuration(65_000)).toBe('1 min 05 s')
    expect(formatDuration(0)).toBe('0 s')
  })
})
