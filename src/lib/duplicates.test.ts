import { describe, expect, it } from 'vitest'
import { duplicateOutcome, findDuplicateCards } from './duplicates'
import { makeCard } from '../test/factories'

describe('findDuplicateCards', () => {
  it('находит совпадения по написанию среди всех карточек', () => {
    const cards = [
      makeCard({ id: 'one', deckId: 'a', front: 'てんぷら' }),
      makeCard({ id: 'two', deckId: 'b', front: ' てんぷら ' }),
      makeCard({ id: 'three', deckId: 'a', front: 'すし' }),
    ]

    expect(findDuplicateCards(cards, 'てんぷら').map((card) => card.id)).toEqual([
      'one',
      'two',
    ])
  })

  it('не находит ничего для нового написания', () => {
    const cards = [makeCard({ front: 'すし' })]
    expect(findDuplicateCards(cards, 'てんぷら')).toEqual([])
  })

  it('игнорирует пустое значение', () => {
    const cards = [makeCard({ front: 'すし' })]
    expect(findDuplicateCards(cards, '   ')).toEqual([])
  })
})

describe('duplicateOutcome', () => {
  const duplicate = makeCard({ front: 'てんぷら' })

  it('создаёт карточку, если дубликатов нет', () => {
    expect(duplicateOutcome([], 'ask')).toBe('create')
  })

  it('создаёт карточку при настройке «игнорировать»', () => {
    expect(duplicateOutcome([duplicate], 'ignore')).toBe('create')
  })

  it('спрашивает и запрещает по настройке', () => {
    expect(duplicateOutcome([duplicate], 'ask')).toBe('ask')
    expect(duplicateOutcome([duplicate], 'deny')).toBe('deny')
  })
})
