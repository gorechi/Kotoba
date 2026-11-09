import type { Rating, SrsState } from '../types'
import { translate } from './i18n'

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

/** Состояние «выучено вручную»: карточка уходит из активного изучения. */
export function knownSrs(now = Date.now()): SrsState {
  return {
    due: now + 365 * DAY,
    interval: 365,
    ease: 2.8,
    reps: 1,
    lapses: 0,
    introduced: true,
    lastReviewed: now,
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
  if (!Number.isFinite(days) || days <= 0) return translate('interval.now')
  if (days < 1 / 24) {
    const n = Math.max(1, Math.round(days * 1440))
    return translate('interval.minutes', { n })
  }
  if (days < 1) {
    const n = Math.max(1, Math.round(days * 24))
    return translate('interval.hours', { n })
  }
  if (days < 30) {
    const n = Math.round(days)
    return translate('interval.days', { n })
  }
  if (days < 365) {
    const n = Math.round(days / 30)
    return translate('interval.months', { n })
  }
  const n = Math.round(days / 365)
  return translate('interval.years', { n })
}

export function intervalPreview(srs: SrsState, rating: Rating): string {
  const next = applyRating(srs, rating, Date.now())
  return formatInterval(next.interval)
}
