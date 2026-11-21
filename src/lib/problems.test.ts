import { describe, expect, it } from 'vitest'
import { isProblemCard, PROBLEM_MISTAKE_WINDOW_DAYS, problemCards } from './problems'
import { makeCard, makeSrs } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()
const DAY = 86_400_000

describe('isProblemCard', () => {
  it('считает проблемной карточку с двумя падениями', () => {
    expect(isProblemCard(makeCard({ srs: makeSrs({ lapses: 2 }) }), NOW)).toBe(true)
    expect(isProblemCard(makeCard({ srs: makeSrs({ lapses: 1 }) }), NOW)).toBe(false)
  })

  it('считает проблемной недавнюю ошибку', () => {
    const recent = makeSrs({ lastMistakeAt: NOW - 2 * DAY })
    const old = makeSrs({ lastMistakeAt: NOW - (PROBLEM_MISTAKE_WINDOW_DAYS + 1) * DAY })
    expect(isProblemCard(makeCard({ srs: recent }), NOW)).toBe(true)
    expect(isProblemCard(makeCard({ srs: old }), NOW)).toBe(false)
  })

  it('не считает карточку без ошибок проблемной', () => {
    expect(isProblemCard(makeCard(), NOW)).toBe(false)
  })
})

describe('problemCards', () => {
  it('сортирует по падениям, затем по свежести ошибки', () => {
    const cards = [
      makeCard({ id: 'one', srs: makeSrs({ lapses: 2, lastMistakeAt: NOW - DAY }) }),
      makeCard({ id: 'two', srs: makeSrs({ lapses: 3 }) }),
      makeCard({ id: 'three', srs: makeSrs({ lapses: 2, lastMistakeAt: NOW - 3 * DAY }) }),
      makeCard({ id: 'clean' }),
    ]
    expect(problemCards(cards, NOW).map((card) => card.id)).toEqual([
      'two',
      'one',
      'three',
    ])
  })
})
