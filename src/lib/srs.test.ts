import { describe, expect, it } from 'vitest'
import { applyRating, DAY, formatInterval, freshSrs, intervalPreview, knownSrs } from './srs'
import { makeSrs } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()

describe('freshSrs', () => {
  it('создаёт новую карточку с нужными значениями по умолчанию', () => {
    expect(freshSrs()).toEqual({
      due: 0,
      interval: 0,
      ease: 2.3,
      reps: 0,
      lapses: 0,
      introduced: false,
      lastReviewed: null,
    })
  })
})

describe('knownSrs', () => {
  it('помечает карточку выученной на год вперёд', () => {
    const srs = knownSrs(NOW)
    expect(srs.due).toBe(NOW + 365 * DAY)
    expect(srs.interval).toBe(365)
    expect(srs.ease).toBe(2.8)
    expect(srs.reps).toBe(1)
    expect(srs.lapses).toBe(0)
    expect(srs.introduced).toBe(true)
    expect(srs.lastReviewed).toBe(NOW)
  })
})

describe('applyRating', () => {
  it('увеличивает счётчик повторений и отмечает карточку изученной', () => {
    const next = applyRating(makeSrs({ reps: 2, introduced: false }), 'good', NOW)
    expect(next.reps).toBe(3)
    expect(next.introduced).toBe(true)
    expect(next.lastReviewed).toBe(NOW)
  })

  it('не меняет исходное состояние', () => {
    const prev = makeSrs({ reps: 1, interval: 4 })
    const snapshot = { ...prev }
    applyRating(prev, 'again', NOW)
    expect(prev).toEqual(snapshot)
  })

  it('«Снова» ставит интервал 10 минут и увеличивает число падений', () => {
    const next = applyRating(makeSrs({ interval: 30, ease: 2.3, lapses: 1 }), 'again', NOW)
    expect(next.interval).toBeCloseTo(10 / 1440)
    expect(next.ease).toBeCloseTo(2.1)
    expect(next.lapses).toBe(2)
    expect(next.due).toBe(NOW + Math.round((10 / 1440) * DAY))
  })

  it('«Снова» не опускает ease ниже 1.3', () => {
    const next = applyRating(makeSrs({ ease: 1.35 }), 'again', NOW)
    expect(next.ease).toBe(1.3)
  })

  it('«Трудно» для новой карточки даёт 12 часов', () => {
    const next = applyRating(makeSrs({ interval: 0, ease: 2.3 }), 'hard', NOW)
    expect(next.interval).toBe(0.5)
    expect(next.ease).toBeCloseTo(2.15)
  })

  it('«Трудно» умножает интервал на 1.2 и не превышает год', () => {
    expect(applyRating(makeSrs({ interval: 10 }), 'hard', NOW).interval).toBe(12)
    expect(applyRating(makeSrs({ interval: 350 }), 'hard', NOW).interval).toBe(365)
  })

  it('«Хорошо» даёт день новой карточке и умножает интервал на ease', () => {
    expect(applyRating(makeSrs({ interval: 0 }), 'good', NOW).interval).toBe(1)
    expect(applyRating(makeSrs({ interval: 5, ease: 2.3 }), 'good', NOW).interval).toBeCloseTo(
      11.5,
    )
    expect(applyRating(makeSrs({ interval: 300, ease: 2.3 }), 'good', NOW).interval).toBe(
      365,
    )
  })

  it('«Легко» даёт три дня новой карточке, растит ease и ограничивает год', () => {
    const fresh = applyRating(makeSrs({ interval: 0, ease: 2.3 }), 'easy', NOW)
    expect(fresh.interval).toBe(3)
    expect(fresh.ease).toBeCloseTo(2.45)

    const grown = applyRating(makeSrs({ interval: 5, ease: 2.3 }), 'easy', NOW)
    expect(grown.interval).toBeCloseTo(5 * 2.3 * 1.4)

    expect(applyRating(makeSrs({ interval: 300, ease: 2.3 }), 'easy', NOW).interval).toBe(
      365,
    )
    expect(applyRating(makeSrs({ ease: 2.75 }), 'easy', NOW).ease).toBe(2.8)
  })

  it('считает дату следующего повторения от переданного момента', () => {
    const next = applyRating(makeSrs({ interval: 0 }), 'easy', NOW)
    expect(next.due).toBe(NOW + 3 * DAY)
  })
})

describe('formatInterval', () => {
  it('показывает интервалы в удобной единице', () => {
    expect(formatInterval(0)).toBe('now')
    expect(formatInterval(-1)).toBe('now')
    expect(formatInterval(Number.NaN)).toBe('now')
    expect(formatInterval(10 / 1440)).toBe('10 min')
    expect(formatInterval(0.5)).toBe('12 h')
    expect(formatInterval(3)).toBe('3 days')
    expect(formatInterval(45)).toBe('2 months')
    expect(formatInterval(800)).toBe('2 years')
  })

  it('строит предпросмотр интервала для оценки', () => {
    expect(intervalPreview(makeSrs({ interval: 0 }), 'easy')).toBe('3 days')
  })
})
