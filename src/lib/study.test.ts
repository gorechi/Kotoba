import { describe, expect, it } from 'vitest'
import { buildStudyQueue, limitStudySession, practiceQueue } from './study'
import { makeCard, makeDayStat, makeDeck, makeDeckSettings, makeSettings, makeSrs } from '../test/factories'

const NOW = new Date(2026, 0, 15, 12, 0, 0).getTime()
const DAY = 86_400_000

const decks = [
  makeDeck({ id: 'deck-a' }),
  makeDeck({ id: 'deck-b' }),
]

const cards = [
  makeCard({
    id: 'due-a1',
    deckId: 'deck-a',
    order: 2,
    srs: makeSrs({ introduced: true, due: NOW - DAY }),
  }),
  makeCard({
    id: 'due-a2',
    deckId: 'deck-a',
    order: 1,
    srs: makeSrs({ introduced: true, due: NOW - 2 * DAY }),
  }),
  makeCard({
    id: 'new-a1',
    deckId: 'deck-a',
    order: 1,
  }),
  makeCard({
    id: 'new-a2',
    deckId: 'deck-a',
    order: 2,
  }),
  makeCard({
    id: 'suspended',
    deckId: 'deck-a',
    suspended: true,
    srs: makeSrs({ introduced: true, due: NOW - DAY }),
  }),
  makeCard({
    id: 'later',
    deckId: 'deck-a',
    srs: makeSrs({ introduced: true, due: NOW + 10 * DAY }),
  }),
  makeCard({
    id: 'due-b',
    deckId: 'deck-b',
    srs: makeSrs({ introduced: true, due: NOW - DAY }),
  }),
]

function ids(
  deckId: string,
  settings = makeSettings(),
  history: Record<string, ReturnType<typeof makeDayStat>> = {},
  deckList = decks,
) {
  return buildStudyQueue(cards, deckList, deckId, history, settings, NOW).map(
    (item) => item.cardId,
  )
}

describe('buildStudyQueue', () => {
  it('ставит повторения перед новыми по умолчанию', () => {
    expect(ids('deck-a')).toEqual(['due-a2', 'due-a1', 'new-a1', 'new-a2'])
  })

  it('умеет ставить новые карточки первыми', () => {
    const ids = buildStudyQueue(
      cards,
      decks,
      'deck-a',
      {},
      makeSettings({ sessionOrder: 'new-first' }),
      NOW,
    ).map((item) => item.cardId)
    expect(ids).toEqual(['new-a1', 'new-a2', 'due-a2', 'due-a1'])
  })

  it('не включает приостановленные и ещё не наступившие карточки', () => {
    const result = ids('deck-a')
    expect(result).not.toContain('suspended')
    expect(result).not.toContain('later')
  })

  it('соблюдает дневной лимит новых карточек', () => {
    const history = {
      '2026-01-15': makeDayStat({ newByDeck: { 'deck-a': 9 } }),
    }
    expect(ids('deck-a', makeSettings({ newPerDay: 10 }), history)).toEqual([
      'due-a2',
      'due-a1',
      'new-a1',
    ])
  })

  it('уважает запрет новых карточек в колоде', () => {
    const deckList = [
      makeDeck({ id: 'deck-a', settings: makeDeckSettings({ allowNew: false }) }),
      makeDeck({ id: 'deck-b' }),
    ]
    expect(ids('deck-a', makeSettings(), {}, deckList)).toEqual(['due-a2', 'due-a1'])
  })

  it('соблюдает лимит повторений', () => {
    const deckList = [
      makeDeck({ id: 'deck-a', settings: makeDeckSettings({ reviewLimit: 1 }) }),
      makeDeck({ id: 'deck-b' }),
    ]
    expect(ids('deck-a', makeSettings(), {}, deckList)).toEqual([
      'due-a2',
      'new-a1',
      'new-a2',
    ])
  })

  it('собирает очередь по нескольким колодам', () => {
    const result = ids('all')
    expect(result).toContain('due-b')
    expect(result).toContain('due-a1')
  })

  it('возвращает пустую очередь для неизвестной колоды', () => {
    expect(ids('missing')).toEqual([])
  })

  it('перемешивает очередь в режиме random, не теряя карточек', () => {
    const ids = buildStudyQueue(
      cards,
      decks,
      'deck-a',
      {},
      makeSettings({ sessionOrder: 'random' }),
      NOW,
    ).map((item) => item.cardId)
    expect([...ids].sort()).toEqual(['due-a1', 'due-a2', 'new-a1', 'new-a2'])
  })

  it('помечает новые карточки флагом isNew', () => {
    const queue = buildStudyQueue(cards, decks, 'deck-a', {}, makeSettings(), NOW)
    expect(queue.find((item) => item.cardId === 'new-a1')?.isNew).toBe(true)
    expect(queue.find((item) => item.cardId === 'due-a1')?.isNew).toBe(false)
  })
})

describe('limitStudySession', () => {
  const queue = [
    { cardId: 'a', isNew: false },
    { cardId: 'b', isNew: true },
    { cardId: 'c', isNew: false },
  ]

  it('ограничивает сессию первыми карточками', () => {
    expect(limitStudySession(queue, 2)).toEqual(queue.slice(0, 2))
  })

  it('не ограничивает при нуле, отрицательном размере и большом лимите', () => {
    expect(limitStudySession(queue, 0)).toBe(queue)
    expect(limitStudySession(queue, -5)).toBe(queue)
    expect(limitStudySession(queue, 99)).toBe(queue)
  })
})

describe('practiceQueue', () => {
  it('берёт только изученные и неотложенные карточки', () => {
    const result = practiceQueue(cards, 'deck-a', 10)
    expect(result.map((item) => item.cardId).sort()).toEqual([
      'due-a1',
      'due-a2',
      'later',
    ])
    expect(result.every((item) => !item.isNew)).toBe(true)
  })

  it('учитывает колоду и размер', () => {
    expect(practiceQueue(cards, 'deck-b', 10).map((item) => item.cardId)).toEqual(['due-b'])
    expect(practiceQueue(cards, 'all', 2)).toHaveLength(2)
  })

  it('возвращает пустую очередь, если нечего повторять', () => {
    expect(practiceQueue([], 'all')).toEqual([])
  })
})
