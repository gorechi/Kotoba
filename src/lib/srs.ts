import type { Rating, SrsState } from '../types'

export const MINUTE = 60_000
export const DAY = 86_400_000

export function freshSrs(): SrsState {
  return {
    due: 0,
    interval: 0,
    ease: 2.3,
    reps: 0,
    lapses: 0,
    introduced: false,
    lastReviewed: null,
  }
}

export function applyRating(prev: SrsState, rating: Rating, now: number): SrsState {
  const next: SrsState = { ...prev, reps: prev.reps + 1, introduced: true, lastReviewed: now }

  switch (rating) {
    case 'again':
      next.interval = 10 / 1440
      next.ease = Math.max(1.3, prev.ease - 0.2)
      next.lapses = prev.lapses + 1
      break
    case 'hard':
      next.interval = prev.interval < 1 ? 0.5 : Math.min(365, prev.interval * 1.2)
      next.ease = Math.max(1.3, prev.ease - 0.15)
      break
    case 'good':
      next.interval = prev.interval < 1 ? 1 : Math.min(365, prev.interval * prev.ease)
      break
    case 'easy':
      next.interval = prev.interval < 1 ? 3 : Math.min(365, prev.interval * prev.ease * 1.4)
      next.ease = Math.min(2.8, prev.ease + 0.15)
      break
  }

  next.due = now + Math.round(next.interval * DAY)
  return next
}

export function formatInterval(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return 'сейчас'
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 1440))} мин`
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} ч`
  if (days < 30) {
    const n = Math.round(days)
    return `${n} ${plural(n, 'день', 'дня', 'дней')}`
  }
  if (days < 365) {
    const n = Math.round(days / 30)
    return `${n} мес`
  }
  return `${Math.round(days / 365)} г`
}

export function intervalPreview(srs: SrsState, rating: Rating): string {
  const next = applyRating(srs, rating, Date.now())
  return formatInterval(next.interval)
}

export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}
