import type { AppData, Card, DayStat, Settings } from '../types'
import { DAY } from './srs'
import { dayKey } from './utils'

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
  const due = pool.filter((card) => card.srs.introduced && card.srs.due <= now).length
  const fresh = pool.filter((card) => !card.srs.introduced).length
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
  const due = cards.filter((card) => card.srs.introduced && card.srs.due <= now).length
  const fresh = cards.filter((card) => !card.srs.introduced).length
  return {
    total: cards.length,
    learned,
    due,
    fresh,
    percent: cards.length ? Math.round((learned / cards.length) * 100) : 0,
  }
}

export function todayStat(data: AppData, now = Date.now()): DayStat {
  return data.history[dayKey(now)] ?? { reviews: 0, correct: 0, newCards: 0, ms: 0 }
}

export function streak(history: Record<string, DayStat>, now = Date.now()): number {
  const cursor = new Date(now)
  if (!(history[dayKey(now)]?.reviews > 0)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let count = 0
  while (history[dayKey(cursor.getTime())]?.reviews > 0) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function accuracy(history: Record<string, DayStat>, days: number, now = Date.now()): number | null {
  let reviews = 0
  let correct = 0
  const cursor = new Date(now)
  for (let i = 0; i < days; i += 1) {
    const stat = history[dayKey(cursor.getTime())]
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
}

export function lastDays(history: Record<string, DayStat>, count: number, now = Date.now()): DayPoint[] {
  const points: DayPoint[] = []
  const cursor = new Date(now)
  cursor.setHours(12, 0, 0, 0)
  cursor.setDate(cursor.getDate() - (count - 1))
  for (let i = 0; i < count; i += 1) {
    const ts = cursor.getTime()
    const key = dayKey(ts)
    const stat = history[key]
    points.push({
      key,
      ts,
      weekday: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(cursor),
      day: cursor.getDate(),
      reviews: stat?.reviews ?? 0,
      correct: stat?.correct ?? 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return points
}

export function totalReviews(history: Record<string, DayStat>): number {
  return Object.values(history).reduce((sum, stat) => sum + stat.reviews, 0)
}

export function totalStudyTime(history: Record<string, DayStat>): number {
  return Object.values(history).reduce((sum, stat) => sum + stat.ms, 0)
}

export function remainingNewToday(
  history: Record<string, DayStat>,
  settings: Settings,
  now = Date.now(),
): number {
  const used = history[dayKey(now)]?.newCards ?? 0
  return Math.max(0, settings.newPerDay - used)
}

export function todayRange(now = Date.now()): number {
  return now - DAY
}
