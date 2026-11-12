import type { AppData, Card, DayStat, Settings, StudyMode, StudyTotals } from '../types'
import { DAY } from './srs'
import { dayKey } from './utils'
import { getActiveLocale } from './i18n'

const ZERO_TOTALS: StudyTotals = { reviews: 0, correct: 0, newCards: 0, ms: 0 }

/** Делит счётчики дня на чтение и письмо. Верхние значения дня — общие. */
export function splitDayStat(day: DayStat | undefined): {
  reading: StudyTotals
  writing: StudyTotals
} {
  const total = day ?? ZERO_TOTALS
  const writing = day?.writing ?? ZERO_TOTALS
  return {
    writing: { ...writing },
    reading: {
      reviews: Math.max(0, total.reviews - writing.reviews),
      correct: Math.max(0, total.correct - writing.correct),
      newCards: Math.max(0, total.newCards - writing.newCards),
      ms: Math.max(0, total.ms - writing.ms),
    },
  }
}

export function dayModeStat(day: DayStat | undefined, mode: StudyMode): StudyTotals {
  return splitDayStat(day)[mode]
}

export function totalModeReviews(history: Record<string, DayStat>, mode: StudyMode): number {
  return Object.values(history).reduce((sum, day) => sum + dayModeStat(day, mode).reviews, 0)
}

export function totalModeStudyTime(history: Record<string, DayStat>, mode: StudyMode): number {
  return Object.values(history).reduce((sum, day) => sum + dayModeStat(day, mode).ms, 0)
}

/** Полдень учебного дня, к которому относится момент now. */
function businessDayNoon(now: number, dayStartHour: number): Date {
  return new Date(`${dayKey(now, dayStartHour)}T12:00:00`)
}

export function modeAccuracy(
  history: Record<string, DayStat>,
  mode: StudyMode,
  days: number,
  now = Date.now(),
  dayStartHour = 0,
): number | null {
  let reviews = 0
  let correct = 0
  const cursor = businessDayNoon(now, dayStartHour)
  for (let i = 0; i < days; i += 1) {
    const stat = dayModeStat(history[dayKey(cursor.getTime(), dayStartHour)], mode)
    reviews += stat.reviews
    correct += stat.correct
    cursor.setDate(cursor.getDate() - 1)
  }
  if (!reviews) return null
  return Math.round((correct / reviews) * 100)
}

export interface DeckStat {
  total: number
  learned: number
  due: number
  fresh: number
  percent: number
}

export function deckStat(cards: Card[], deckId: string, now = Date.now()): DeckStat {
  const pool = cards.filter((card) => card.deckId === deckId)
  const learned = pool.filter((card) => card.srs.introduced).length
  const due = pool.filter(
    (card) => !card.suspended && card.srs.introduced && card.srs.due <= now,
  ).length
  const fresh = pool.filter((card) => !card.suspended && !card.srs.introduced).length
  return {
    total: pool.length,
    learned,
    due,
    fresh,
    percent: pool.length ? Math.round((learned / pool.length) * 100) : 0,
  }
}

export function overallStat(cards: Card[], now = Date.now()): DeckStat {
  const learned = cards.filter((card) => card.srs.introduced).length
  const due = cards.filter(
    (card) => !card.suspended && card.srs.introduced && card.srs.due <= now,
  ).length
  const fresh = cards.filter((card) => !card.suspended && !card.srs.introduced).length
  return {
    total: cards.length,
    learned,
    due,
    fresh,
    percent: cards.length ? Math.round((learned / cards.length) * 100) : 0,
  }
}

export function todayStat(data: AppData, now = Date.now()): DayStat {
  return (
    data.history[dayKey(now, data.settings.dayStartHour)] ?? {
      reviews: 0,
      correct: 0,
      newCards: 0,
      ms: 0,
    }
  )
}

export function streak(
  history: Record<string, DayStat>,
  now = Date.now(),
  dayStartHour = 0,
): number {
  const todayKey = dayKey(now, dayStartHour)
  const cursor = new Date(`${todayKey}T12:00:00`)
  if (!(history[todayKey]?.reviews > 0)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let count = 0
  while (history[dayKey(cursor.getTime(), dayStartHour)]?.reviews > 0) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function accuracy(
  history: Record<string, DayStat>,
  days: number,
  now = Date.now(),
  dayStartHour = 0,
): number | null {
  let reviews = 0
  let correct = 0
  const cursor = businessDayNoon(now, dayStartHour)
  for (let i = 0; i < days; i += 1) {
    const stat = history[dayKey(cursor.getTime(), dayStartHour)]
    if (stat) {
      reviews += stat.reviews
      correct += stat.correct
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  if (!reviews) return null
  return Math.round((correct / reviews) * 100)
}

export interface DayPoint {
  key: string
  ts: number
  weekday: string
  day: number
  reviews: number
  correct: number
  newCards: number
  ms: number
  readingReviews: number
  writingReviews: number
}

export function lastDays(
  history: Record<string, DayStat>,
  count: number,
  now = Date.now(),
  dayStartHour = 0,
): DayPoint[] {
  const points: DayPoint[] = []
  const cursor = businessDayNoon(now, dayStartHour)
  cursor.setDate(cursor.getDate() - (count - 1))
  for (let i = 0; i < count; i += 1) {
    const ts = cursor.getTime()
    const key = dayKey(ts, dayStartHour)
    const stat = history[key]
    const split = splitDayStat(stat)
    points.push({
      key,
      ts,
      weekday: new Intl.DateTimeFormat(getActiveLocale().intl, { weekday: 'short' }).format(cursor),
      day: cursor.getDate(),
      reviews: stat?.reviews ?? 0,
      correct: stat?.correct ?? 0,
      newCards: stat?.newCards ?? 0,
      ms: stat?.ms ?? 0,
      readingReviews: split.reading.reviews,
      writingReviews: split.writing.reviews,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return points
}

/** Сколько недель показывать в календаре активности. */
export const HEATMAP_WEEKS = 53

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapDay {
  key: string
  ts: number
  /** Локализованная дата для подсказки. */
  label: string
  reviews: number
  level: HeatmapLevel
  future: boolean
}

export interface HeatmapMonth {
  label: string
  week: number
  span: number
}

export interface Heatmap {
  weeks: HeatmapDay[][]
  months: HeatmapMonth[]
  weekdays: { row: number; label: string }[]
  total: number
  activeDays: number
}

function heatmapLevel(reviews: number): HeatmapLevel {
  if (reviews <= 0) return 0
  if (reviews < 5) return 1
  if (reviews < 10) return 2
  if (reviews < 20) return 3
  return 4
}

/**
 * Строит календарь активности в стиле GitHub: 53 недели по 7 дней.
 * Неделя начинается с понедельника; дни после сегодняшнего остаются пустыми.
 */
export function buildHeatmap(
  history: Record<string, DayStat>,
  now = Date.now(),
  intl = getActiveLocale().intl,
  dayStartHour = 0,
): Heatmap {
  const dayFormatter = new Intl.DateTimeFormat(intl, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const monthFormatter = new Intl.DateTimeFormat(intl, { month: 'short' })
  const weekdayFormatter = new Intl.DateTimeFormat(intl, { weekday: 'short' })

  const end = businessDayNoon(now, dayStartHour)
  const todayTs = end.getTime()
  const dayOfWeek = (end.getDay() + 6) % 7 // понедельник = 0

  const start = new Date(end)
  start.setDate(start.getDate() - dayOfWeek - (HEATMAP_WEEKS - 1) * 7)
  start.setHours(12, 0, 0, 0)

  const weeks: HeatmapDay[][] = []
  const months: HeatmapMonth[] = []
  let total = 0
  let activeDays = 0
  let lastMonth = -1

  for (let weekIndex = 0; weekIndex < HEATMAP_WEEKS; weekIndex += 1) {
    const days: HeatmapDay[] = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + weekIndex * 7 + dayIndex)
      date.setHours(12, 0, 0, 0)

      const ts = date.getTime()
      const key = dayKey(ts, dayStartHour)
      const future = ts > todayTs
      const reviews = future ? 0 : (history[key]?.reviews ?? 0)

      if (!future) {
        total += reviews
        if (reviews > 0) activeDays += 1
      }

      // Метка месяца ставится на неделю, в которой начинается новый месяц.
      if (
        (weekIndex === 0 && dayIndex === 0) ||
        (date.getDate() === 1 && date.getMonth() !== lastMonth)
      ) {
        const previous = months[months.length - 1]
        if (previous && previous.week === weekIndex) {
          // Месяц сменился внутри первой недели — оставляем один label на неделю.
          previous.label = monthFormatter.format(date)
        } else {
          months.push({ label: monthFormatter.format(date), week: weekIndex, span: 1 })
        }
        lastMonth = date.getMonth()
      }

      days.push({
        key,
        ts,
        label: dayFormatter.format(date),
        reviews,
        level: heatmapLevel(reviews),
        future,
      })
    }

    weeks.push(days)
  }

  for (let i = 0; i < months.length; i += 1) {
    const next = months[i + 1]
    months[i].span = (next ? next.week : HEATMAP_WEEKS) - months[i].week
  }

  const weekdays = [0, 2, 4].map((row) => {
    const date = new Date(start)
    date.setDate(start.getDate() + row)
    date.setHours(12, 0, 0, 0)
    return { row, label: weekdayFormatter.format(date) }
  })

  return { weeks, months, weekdays, total, activeDays }
}

export function totalReviews(history: Record<string, DayStat>): number {
  return Object.values(history).reduce((sum, stat) => sum + stat.reviews, 0)
}

export function totalStudyTime(history: Record<string, DayStat>): number {
  return Object.values(history).reduce((sum, stat) => sum + stat.ms, 0)
}

export interface DailyGoalProgress {
  done: number
  goal: number
  percent: number
  unit: Settings['dailyGoalType']
}

export function dailyGoalProgress(today: DayStat, settings: Settings): DailyGoalProgress {
  const goal =
    settings.dailyGoalType === 'minutes' ? settings.dailyMinuteGoal : settings.dailyReviewGoal
  const done = settings.dailyGoalType === 'minutes' ? Math.round(today.ms / 60_000) : today.reviews
  return {
    done,
    goal,
    percent: goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0,
    unit: settings.dailyGoalType,
  }
}

export interface Milestone {
  type: 'reviews' | 'cards' | 'streak'
  current: number
  target: number
  percent: number
  remaining: number
}

/** Ближайшая незакрытая личная цель. */
export function nearestMilestone(
  reviews: number,
  learnedCards: number,
  currentStreak: number,
  settings: Settings,
): Milestone | null {
  const goals: Array<{ type: Milestone['type']; current: number; target: number }> = [
    {
      type: 'reviews',
      current: reviews,
      target: settings.goalReviews,
    },
    {
      type: 'cards',
      current: learnedCards,
      target: settings.goalCards,
    },
    {
      type: 'streak',
      current: currentStreak,
      target: settings.goalStreak,
    },
  ]
  const candidates: Milestone[] = goals
    .map((item) => ({
      ...item,
      percent: item.target > 0 ? Math.min(100, Math.round((item.current / item.target) * 100)) : 0,
      remaining: Math.max(0, item.target - item.current),
    }))
    .filter((item) => item.remaining > 0)
    .sort((a, b) => b.percent - a.percent)

  return candidates[0] ?? null
}

export interface MemoryStrengthStat {
  total: number
  fresh: number
  learning: number
  consolidating: number
  mature: number
}

export function memoryStrength(cards: Card[]): MemoryStrengthStat {
  const result: MemoryStrengthStat = {
    total: cards.length,
    fresh: 0,
    learning: 0,
    consolidating: 0,
    mature: 0,
  }
  for (const card of cards) {
    if (!card.srs.introduced) result.fresh += 1
    else if (card.srs.interval >= 21) result.mature += 1
    else if (card.srs.interval >= 7) result.consolidating += 1
    else result.learning += 1
  }
  return result
}

export interface DayRecord {
  key: string
  reviews: number
  accuracy: number
}

export interface WeekRecord {
  startKey: string
  reviews: number
}

export interface PersonalRecords {
  bestDay: DayRecord | null
  bestWeek: WeekRecord | null
  longestStreak: number
  bestAccuracy: DayRecord | null
}

function keyToNoon(key: string): number {
  return new Date(`${key}T12:00:00`).getTime()
}

export function personalRecords(history: Record<string, DayStat>): PersonalRecords {
  const entries = Object.entries(history).filter(([, day]) => day.reviews > 0)
  let bestDay: DayRecord | null = null
  let bestAccuracy: DayRecord | null = null
  const weekTotals = new Map<string, number>()

  for (const [key, day] of entries) {
    const accuracy = day.reviews > 0 ? Math.round((day.correct / day.reviews) * 100) : 0

    if (!bestDay || day.reviews > bestDay.reviews) {
      bestDay = { key, reviews: day.reviews, accuracy }
    }

    if (day.reviews >= 10) {
      if (
        !bestAccuracy ||
        accuracy > bestAccuracy.accuracy ||
        (accuracy === bestAccuracy.accuracy && day.reviews > bestAccuracy.reviews)
      ) {
        bestAccuracy = { key, reviews: day.reviews, accuracy }
      }
    }

    const date = new Date(keyToNoon(key))
    const dayOfWeek = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - dayOfWeek)
    const weekKey = dayKey(date.getTime())
    weekTotals.set(weekKey, (weekTotals.get(weekKey) ?? 0) + day.reviews)
  }

  let bestWeek: WeekRecord | null = null
  for (const [startKey, reviews] of weekTotals) {
    if (!bestWeek || reviews > bestWeek.reviews) bestWeek = { startKey, reviews }
  }

  const keys = entries.map(([key]) => key).sort()
  let longestStreak = 0
  let currentStreak = 0
  let previousTs: number | null = null
  for (const key of keys) {
    const ts = keyToNoon(key)
    currentStreak =
      previousTs !== null && Math.round((ts - previousTs) / DAY) === 1 ? currentStreak + 1 : 1
    longestStreak = Math.max(longestStreak, currentStreak)
    previousTs = ts
  }

  return { bestDay, bestWeek, longestStreak, bestAccuracy }
}

export interface PaceForecast {
  total: number
  learned: number
  remaining: number
  pace: number
  days: number | null
}

export function paceForecast(
  cards: Card[],
  history: Record<string, DayStat>,
  newPerDay: number,
  now = Date.now(),
  windowDays = 14,
  dayStartHour = 0,
): PaceForecast {
  const active = cards.filter((card) => !card.suspended)
  const remaining = active.filter((card) => !card.srs.introduced).length
  const points = lastDays(history, windowDays, now, dayStartHour)
  const newCards = points.reduce((sum, point) => sum + point.newCards, 0)
  const recentPace = newCards / windowDays
  // Не показываем пугающе долгий прогноз из-за одной медленной недели:
  // за основу берём хотя бы запланированный темп новых карточек.
  const pace = Math.max(newPerDay, recentPace)
  const days = remaining === 0 ? 0 : pace > 0 ? Math.ceil(remaining / pace) : null

  return {
    total: active.length,
    learned: active.length - remaining,
    remaining,
    pace,
    days,
  }
}

export interface UpcomingDay {
  key: string
  ts: number
  count: number
  label: string
  isToday: boolean
}

/** Нагрузка по повторениям на ближайшие дни. Просроченные входят в сегодня. */
export function upcomingLoad(
  cards: Card[],
  now = Date.now(),
  intl = getActiveLocale().intl,
  days = 7,
  dayStartHour = 0,
): UpcomingDay[] {
  const formatter = new Intl.DateTimeFormat(intl, { weekday: 'short' })
  const today = businessDayNoon(now, dayStartHour)
  today.setHours(dayStartHour, 0, 0, 0)
  const result: UpcomingDay[] = []

  for (let index = 0; index < days; index += 1) {
    const start = new Date(today)
    start.setDate(today.getDate() + index)
    const end = new Date(start)
    end.setDate(start.getDate() + 1)
    const startTs = start.getTime()
    const endTs = end.getTime()

    let count = 0
    for (const card of cards) {
      if (card.suspended || !card.srs.introduced || card.srs.due <= 0) continue
      if (index === 0 ? card.srs.due < endTs : card.srs.due >= startTs && card.srs.due < endTs) {
        count += 1
      }
    }

    result.push({
      key: dayKey(startTs, dayStartHour),
      ts: startTs,
      count,
      label: formatter.format(start),
      isToday: index === 0,
    })
  }

  return result
}

export function todayRange(now = Date.now()): number {
  return now - DAY
}
