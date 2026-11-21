import { describe, expect, it } from 'vitest'
import { SESSION_ORDER_OPTIONS, sessionOrderForDeck, sessionOrderLabelKey } from './session-order'
import { makeDeck, makeDeckSettings, makeSettings } from '../test/factories'

describe('SESSION_ORDER_OPTIONS', () => {
  it('содержит все варианты порядка', () => {
    expect(SESSION_ORDER_OPTIONS.map((item) => item.value)).toEqual([
      'random',
      'deck',
      'new-first',
      'reviews-first',
    ])
  })
})

describe('sessionOrderLabelKey', () => {
  it('возвращает ключ перевода для известного порядка', () => {
    expect(sessionOrderLabelKey('random')).toBe('sessionOrder.random')
    expect(sessionOrderLabelKey('deck')).toBe('sessionOrder.deck')
  })

  it('падает обратно на порядок по умолчанию', () => {
    expect(sessionOrderLabelKey('unknown' as never)).toBe('sessionOrder.reviewsFirst')
  })
})

describe('sessionOrderForDeck', () => {
  it('использует настройку колоды, если она задана', () => {
    const deck = makeDeck({ settings: makeDeckSettings({ sessionOrder: 'random' }) })
    expect(sessionOrderForDeck(deck, makeSettings({ sessionOrder: 'deck' }))).toBe('random')
  })

  it('падает обратно на глобальную настройку', () => {
    expect(sessionOrderForDeck(makeDeck(), makeSettings({ sessionOrder: 'deck' }))).toBe('deck')
    expect(sessionOrderForDeck(undefined, makeSettings({ sessionOrder: 'new-first' }))).toBe(
      'new-first',
    )
  })
})
