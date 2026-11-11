import type { Deck, SessionOrder, Settings } from '../types'
import { getDeckSettings } from './deck-settings'

export const SESSION_ORDER_OPTIONS: {
  value: SessionOrder
  labelKey: string
}[] = [
  { value: 'random', labelKey: 'sessionOrder.random' },
  { value: 'deck', labelKey: 'sessionOrder.deck' },
  { value: 'new-first', labelKey: 'sessionOrder.newFirst' },
  { value: 'reviews-first', labelKey: 'sessionOrder.reviewsFirst' },
]

export function sessionOrderLabelKey(order: SessionOrder): string {
  return (
    SESSION_ORDER_OPTIONS.find((item) => item.value === order)?.labelKey ??
    'sessionOrder.reviewsFirst'
  )
}

/** Порядок сессии для колоды: настройки колоды главнее глобальных. */
export function sessionOrderForDeck(
  deck: Deck | undefined,
  settings: Settings,
): SessionOrder {
  if (deck) {
    const own = getDeckSettings(deck).sessionOrder
    if (own !== null) return own
  }
  return settings.sessionOrder
}
