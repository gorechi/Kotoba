// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { TrashPanel } from './TrashPanel'

const { store } = vi.hoisted(() => ({
  store: {
    data: {
      decks: [] as unknown[],
      cards: [] as unknown[],
      trash: [] as unknown[],
      settings: { trashRetentionDays: 10 },
    },
    update: vi.fn(),
    trackWork: vi.fn(),
  },
}))

vi.mock('../state/store', () => ({
  useStore: () => store,
}))

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { intl: 'en-US' },
  }),
}))

const deck = {
  id: 'deck-1',
  name: 'Deck',
  nameJp: '',
  description: '',
  accent: '#000',
  builtin: false,
  kind: 'kana',
  createdAt: 0,
}

function trashCard(deckId = 'missing-deck') {
  return {
    id: 'card-1',
    kind: 'card',
    deletedAt: Date.now(),
    card: {
      id: 'card-1',
      deckId,
      front: 'みず',
      reading: 'mizu',
    },
  }
}

function setData(patch: Partial<typeof store.data>) {
  store.data = {
    decks: [],
    cards: [],
    trash: [],
    settings: { trashRetentionDays: 10 },
    ...patch,
  }
}

beforeEach(() => {
  store.update.mockClear()
  store.trackWork.mockClear()
})

afterEach(cleanup)

describe('TrashPanel', () => {
  it('предлагает выбрать колоду, если исходная удалена', () => {
    setData({ decks: [deck], trash: [trashCard()] })
    render(<TrashPanel />)

    fireEvent.click(screen.getByText('trash.restore'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('trash.restoreDeckTitle')).toBeTruthy()

    fireEvent.click(within(dialog).getByText('trash.restore'))

    expect(store.update).toHaveBeenCalledTimes(1)
    const update = store.update.mock.calls[0][0] as (current: unknown) => unknown
    const next = update(store.data) as {
      cards: { deckId: string }[]
      trash: unknown[]
    }
    expect(next.cards[0].deckId).toBe('deck-1')
    expect(next.trash).toHaveLength(0)
    expect(store.trackWork).toHaveBeenCalledTimes(1)
  })

  it('не открывает выбор, если исходная колода существует', () => {
    setData({ decks: [deck], trash: [trashCard('deck-1')] })
    render(<TrashPanel />)

    fireEvent.click(screen.getByText('trash.restore'))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(store.update).toHaveBeenCalledTimes(1)
  })

  it('сообщает, если восстанавливать некуда', () => {
    setData({ decks: [], trash: [trashCard()] })
    render(<TrashPanel />)

    fireEvent.click(screen.getByText('trash.restore'))

    expect(screen.getByText('trash.noDecks')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(store.update).not.toHaveBeenCalled()
  })
})
