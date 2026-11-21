import { describe, expect, it } from 'vitest'
import {
  accuracy,
  buildHeatmap,
  dailyGoalProgress,
  deckStat,
  HEATMAP_WEEKS,
  lastDays,
  memoryStrength,
  nearestMilestone,
  overallStat,
  paceForecast,
  personalRecords,
  streak,
  todayStat,
  totalReviews,
  upcomingLoad,
} from './stats'
import { makeCard, makeData, makeDayStat, makeSettings, makeSrs } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()

describe('streak', () => {
  it('считает сегодняшнюю активность', () => {
    expect(streak({ '2026-01-15': makeDayStat({ reviews: 1 }) }, NOW)).toBe(1)
  })

  it('не обрывает серию, если сегодня ещё не занимался', () => {
    expect(streak({ '2026-01-14': makeDayStat({ reviews: 3 }) }, NOW)).toBe(1)
  })

  it('считает подряд идущие дни', () => {
    const history = {
      '2026-01-13': makeDayStat({ reviews: 1 }),
      '2026-01-14': makeDayStat({ reviews: 1 }),
      '2026-01-15': makeDayStat({ reviews: 1 }),
    }
    expect(streak(history, NOW)).toBe(3)
  })

  it('учитывает дни только с работой над карточками', () => {
    const history = {
      '2026-01-14': makeDayStat({ work: 2 }),
      '2026-01-15': makeDayStat({ work: 1 }),
    }
    expect(streak(history, NOW)).toBe(2)
  })

  it('прерывается на пропущенном дне', () => {
    const history = {
      '2026-01-13': makeDayStat({ reviews: 1 }),
      '2026-01-15': makeDayStat({ reviews: 1 }),
    }
    expect(streak(history, NOW)).toBe(1)
  })

  it('учитывает начало учебного дня', () => {
    const lateNight = new Date(2026, 0, 16, 2, 0, 0).getTime()
    expect(streak({ '2026-01-15': makeDayStat({ reviews: 1 }) }, lateNight, 3)).toBe(1)
  })
})

describe('buildHeatmap', () => {
  it('строит сетку на 53 недели по 7 дней', () => {
    const map = buildHeatmap({}, NOW, 'en-US')
    expect(map.weeks).toHaveLength(HEATMAP_WEEKS)
    expect(map.weeks.every((week) => week.length === 7)).toBe(true)
    expect(map.weekdays).toHaveLength(3)
    expect(map.months.length).toBeGreaterThan(0)
  })

  it('суммирует повторения и работу, считая активные дни', () => {
    const map = buildHeatmap(
      {
        '2026-01-14': makeDayStat({ work: 3 }),
        '2026-01-15': makeDayStat({ reviews: 12 }),
      },
      NOW,
      'en-US',
    )

    expect(map.total).toBe(12)
    expect(map.work).toBe(3)
    expect(map.activeDays).toBe(2)
  })

  it('раскрашивает клетки по сумме повторений и работы', () => {
    const levels = [
      [0, 0],
      [1, 1],
      [5, 2],
      [10, 3],
      [20, 4],
    ] as const

    for (const [reviews, expected] of levels) {
      const map = buildHeatmap(
        { '2026-01-15': makeDayStat({ reviews }) },
        NOW,
        'en-US',
      )
      const today = map.weeks.flat().find((day) => day.key === '2026-01-15')
      expect(today?.level, `reviews=${reviews}`).toBe(expected)
    }

    const workOnly = buildHeatmap(
      { '2026-01-15': makeDayStat({ work: 4 }) },
      NOW,
      'en-US',
    )
    expect(workOnly.weeks.flat().find((day) => day.key === '2026-01-15')?.level).toBe(1)
  })

  it('не считает будущие дни', () => {
    const map = buildHeatmap({}, NOW, 'en-US')
    const future = map.weeks.flat().filter((day) => day.future)
    expect(future.length).toBeGreaterThan(0)
    expect(future.every((day) => day.reviews === 0 && day.work === 0)).toBe(true)
  })
})

describe('accuracy', () => {
  it('считает точность за последние дни', () => {
    const history = {
      '2026-01-14': makeDayStat({ reviews: 5, correct: 4 }),
      '2026-01-15': makeDayStat({ reviews: 5, correct: 4 }),
    }
    expect(accuracy(history, 7, NOW)).toBe(80)
  })

  it('возвращает null без повторений', () => {
    expect(accuracy({}, 7, NOW)).toBeNull()
  })
})

describe('lastDays', () => {
  it('возвращает последние дни, заканчивая сегодняшним', () => {
    const points = lastDays({ '2026-01-15': makeDayStat({ reviews: 2 }) }, 14, NOW)
    expect(points).toHaveLength(14)
    expect(points[13].key).toBe('2026-01-15')
    expect(points[13].reviews).toBe(2)
    expect(points[0].key).toBe('2026-01-02')
  })
})

describe('totalReviews', () => {
  it('суммирует повторения по всей истории', () => {
    expect(
      totalReviews({
        '2026-01-14': makeDayStat({ reviews: 3 }),
        '2026-01-15': makeDayStat({ reviews: 4 }),
      }),
    ).toBe(7)
  })
})

describe('dailyGoalProgress', () => {
  it('считает цель по повторениям', () => {
    const progress = dailyGoalProgress(
      makeDayStat({ reviews: 10 }),
      makeSettings({ dailyGoalType: 'reviews', dailyReviewGoal: 20 }),
    )
    expect(progress).toMatchObject({ done: 10, goal: 20, percent: 50, unit: 'reviews' })
  })

  it('считает цель по минутам', () => {
    const progress = dailyGoalProgress(
      makeDayStat({ ms: 7.5 * 60_000 }),
      makeSettings({ dailyGoalType: 'minutes', dailyMinuteGoal: 15 }),
    )
    expect(progress).toMatchObject({ done: 8, goal: 15, percent: 53, unit: 'minutes' })
  })

  it('не превышает 100%', () => {
    const progress = dailyGoalProgress(
      makeDayStat({ reviews: 100 }),
      makeSettings({ dailyGoalType: 'reviews', dailyReviewGoal: 20 }),
    )
    expect(progress.percent).toBe(100)
  })
})

describe('nearestMilestone', () => {
  it('выбирает ближайшую незакрытую цель', () => {
    const milestone = nearestMilestone(990, 10, 3, makeSettings())
    expect(milestone).toMatchObject({ type: 'reviews', current: 990, target: 1000 })
  })

  it('возвращает null, когда все цели закрыты', () => {
    expect(nearestMilestone(1000, 100, 30, makeSettings())).toBeNull()
  })
})

describe('memoryStrength', () => {
  it('делит карточки по стадии запоминания', () => {
    const cards = [
      makeCard({ id: 'fresh', srs: makeSrs() }),
      makeCard({ id: 'learning', srs: makeSrs({ introduced: true, interval: 3 }) }),
      makeCard({ id: 'consolidating', srs: makeSrs({ introduced: true, interval: 10 }) }),
      makeCard({ id: 'mature', srs: makeSrs({ introduced: true, interval: 40 }) }),
    ]
    expect(memoryStrength(cards)).toEqual({
      total: 4,
      fresh: 1,
      learning: 1,
      consolidating: 1,
      mature: 1,
    })
  })
})

describe('personalRecords', () => {
  it('находит лучший день, неделю, точность и серию', () => {
    const records = personalRecords({
      '2026-01-05': makeDayStat({ reviews: 12, correct: 10 }),
      '2026-01-06': makeDayStat({ reviews: 5, correct: 5 }),
      '2026-01-12': makeDayStat({ reviews: 20, correct: 10 }),
      '2026-01-13': makeDayStat({ work: 5 }),
    })

    expect(records.bestDay).toMatchObject({ key: '2026-01-12', reviews: 20 })
    expect(records.bestAccuracy).toMatchObject({ key: '2026-01-05' })
    expect(records.bestWeek).toMatchObject({ startKey: '2026-01-12', reviews: 20 })
    expect(records.longestStreak).toBe(2)
  })
})

describe('deckStat и overallStat', () => {
  const cards = [
    makeCard({ id: 'new', deckId: 'deck-1' }),
    makeCard({ id: 'new-suspended', deckId: 'deck-1', suspended: true }),
    makeCard({
      id: 'due',
      deckId: 'deck-1',
      srs: makeSrs({ introduced: true, due: NOW - 1, interval: 3 }),
    }),
    makeCard({
      id: 'later',
      deckId: 'deck-1',
      srs: makeSrs({ introduced: true, due: NOW + 1000, interval: 40 }),
    }),
    makeCard({ id: 'other-deck', deckId: 'deck-2' }),
  ]

  it('считает статистику колоды', () => {
    expect(deckStat(cards, 'deck-1', NOW)).toEqual({
      total: 4,
      learned: 2,
      due: 1,
      fresh: 1,
      percent: 50,
    })
  })

  it('считает общую статистику', () => {
    expect(overallStat(cards, NOW)).toMatchObject({
      total: 5,
      learned: 2,
      due: 1,
      fresh: 2,
      percent: 40,
    })
  })

  it('возвращает нули для пустой колоды', () => {
    expect(deckStat([], 'empty', NOW)).toEqual({
      total: 0,
      learned: 0,
      due: 0,
      fresh: 0,
      percent: 0,
    })
  })
})

describe('upcomingLoad', () => {
  it('складывает просроченные в сегодня и распределяет будущие дни', () => {
    const cards = [
      makeCard({
        id: 'overdue',
        srs: makeSrs({ introduced: true, due: NOW - 3 * 86_400_000 }),
      }),
      makeCard({ id: 'today', srs: makeSrs({ introduced: true, due: NOW + 3_600_000 }) }),
      makeCard({ id: 'tomorrow', srs: makeSrs({ introduced: true, due: NOW + 86_400_000 }) }),
      makeCard({
        id: 'suspended',
        suspended: true,
        srs: makeSrs({ introduced: true, due: NOW + 86_400_000 }),
      }),
      makeCard({ id: 'new' }),
    ]

    const load = upcomingLoad(cards, NOW, 'en-US', 3)

    expect(load).toHaveLength(3)
    expect(load[0]).toMatchObject({ key: '2026-01-15', count: 2, isToday: true })
    expect(load[1]).toMatchObject({ key: '2026-01-16', count: 1, isToday: false })
    expect(load[2]).toMatchObject({ key: '2026-01-17', count: 0 })
  })
})

describe('paceForecast', () => {
  it('оценивает оставшиеся дни по плану новых карточек', () => {
    const activeNew = Array.from({ length: 10 }, (_, index) =>
      makeCard({ id: `new-${index}` }),
    )
    const learned = makeCard({
      id: 'learned',
      srs: makeSrs({ introduced: true, due: NOW + 1000 }),
    })
    const suspendedNew = makeCard({ id: 'suspended-new', suspended: true })

    const forecast = paceForecast([...activeNew, learned, suspendedNew], {}, 5, NOW)

    expect(forecast).toMatchObject({ total: 11, learned: 1, remaining: 10, pace: 5, days: 2 })
  })

  it('возвращает ноль дней, когда новых не осталось', () => {
    const learned = makeCard({
      id: 'learned',
      srs: makeSrs({ introduced: true, due: NOW + 1000 }),
    })
    expect(paceForecast([learned], {}, 5, NOW).days).toBe(0)
  })

  it('учитывает реальный темп, если он выше плана', () => {
    const history: Record<string, ReturnType<typeof makeDayStat>> = {}
    for (let index = 0; index < 14; index += 1) {
      const date = new Date(NOW)
      date.setDate(date.getDate() - index)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`
      history[key] = makeDayStat({ newCards: 5 })
    }

    const cards = Array.from({ length: 10 }, (_, index) => makeCard({ id: `n-${index}` }))
    const forecast = paceForecast(cards, history, 2, NOW)
    expect(forecast.pace).toBe(5)
    expect(forecast.days).toBe(2)
  })
})

describe('todayStat', () => {
  it('возвращает статистику текущего дня или нули', () => {
    const data = makeData({ history: { '2026-01-15': makeDayStat({ reviews: 4 }) } })
    expect(todayStat(data, NOW).reviews).toBe(4)
    expect(todayStat(makeData(), NOW).reviews).toBe(0)
  })
})
