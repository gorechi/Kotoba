import type { Card } from '../types'
import { DAY } from './srs'

/** Свежие ошибки тоже считаем проблемой, даже если падений пока мало. */
export const PROBLEM_MISTAKE_WINDOW_DAYS = 14

export function isProblemCard(card: Card, now = Date.now()): boolean {
  if (card.srs.lapses >= 2) return true
  return (
    typeof card.srs.lastMistakeAt === 'number' &&
    card.srs.lastMistakeAt >= now - PROBLEM_MISTAKE_WINDOW_DAYS * DAY
  )
}

export function problemCards(cards: Card[], now = Date.now()): Card[] {
  return cards
    .filter((card) => isProblemCard(card, now))
    .sort(
      (a, b) =>
        b.srs.lapses - a.srs.lapses ||
        (b.srs.lastMistakeAt ?? 0) - (a.srs.lastMistakeAt ?? 0) ||
        a.front.localeCompare(b.front),
    )
}
