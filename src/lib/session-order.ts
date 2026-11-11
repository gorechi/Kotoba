import type { Deck, SessionOrder, Settings } from '../types'
import { getDeckSettings } from './deck-settings'

export const SESSION_ORDER_OPTIONS: {
  value: SessionOrder
  labelKey: string
  descKey: string
}[] = [
  {
    value: 'random',
    labelKey: 'sessionOrder.random',
    descKey: 'sessionOrder.randomDesc',
  },
  {
    value: 'deck',
    labelKey: 'sessionOrder.deck',
    descKey: 'sessionOrder.deckDesc',
  },
  {
    value: 'new-first',
    labelKey: 'sessionOrder.newFirst',
    descKey: 'sessionOrder.newFirstDesc',
  },
  {
    value: 'reviews-first',
    labelKey: 'sessionOrder.reviewsFirst',
    descKey: 'sessionOrder.reviewsFirstDesc',
  },
]

export function sessionOrderLabelKey(order: SessionOrder): string {
  return SESSION_ORDER_OPTIONS.find((item) => item.value === order)?.labelKey ?? 'sessionOrder.reviewsFirst'
}

export function sessionOrderDescKey(order: SessionOrder): string {
  return SESSION_ORDER_OPTIONS.find((item) => item.value === order)?.descKey ?? 'sessionOrder.reviewsFirstDesc'
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
