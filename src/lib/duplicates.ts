import type { Card, DuplicateAction } from '../types'

/** Карточки с тем же написанием, что и у новой карточки. */
export function findDuplicateCards(cards: Card[], front: string): Card[] {
  const value = front.trim().normalize('NFC')
  if (!value) return []
  return cards.filter((card) => card.front.trim().normalize('NFC') === value)
}

type DuplicateOutcome = 'create' | 'ask' | 'deny'

/** Что делать с найденными дубликатами при текущей настройке. */
export function duplicateOutcome(
  duplicates: Card[],
  action: DuplicateAction,
): DuplicateOutcome {
  if (duplicates.length === 0 || action === 'ignore') return 'create'
  return action === 'deny' ? 'deny' : 'ask'
}
