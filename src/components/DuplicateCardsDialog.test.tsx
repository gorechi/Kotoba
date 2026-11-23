// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DuplicateCardsDialog } from './DuplicateCardsDialog'
import { makeCard } from '../test/factories'

const { update } = vi.hoisted(() => ({ update: vi.fn() }))

vi.mock('../state/store', () => ({
  useStore: () => ({
    data: {
      decks: [{ id: 'deck-1', name: 'Колода', builtin: false, kind: 'kana' }],
    },
    update,
  }),
}))

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('./CardPreview', () => ({
  CardPreview: ({ card }: { card: { front: string } }) => (
    <div data-testid="preview">{card.front}</div>
  ),
}))

const cards = [
  makeCard({ id: 'one', deckId: 'deck-1', front: '水', meaning: 'вода' }),
  makeCard({ id: 'two', deckId: 'deck-1', front: '火', meaning: 'огонь' }),
]

afterEach(cleanup)

beforeEach(() => {
  update.mockClear()
})

describe('DuplicateCardsDialog', () => {
  it('показывает существующие карточки и их действия', () => {
    render(
      <DuplicateCardsDialog cards={cards} onIgnore={() => {}} onCancel={() => {}} />,
    )

    expect(screen.getByText('duplicates.askText')).toBeTruthy()
    expect(screen.getByText('水')).toBeTruthy()
    expect(screen.getByText('火')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /browser.preview/ })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /duplicates.deleteAria/ })).toHaveLength(2)
  })

  it('открывает просмотр и вызывает действия модалки', () => {
    const onIgnore = vi.fn()
    const onCancel = vi.fn()
    render(<DuplicateCardsDialog cards={cards} onIgnore={onIgnore} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: 'browser.preview: 水' }))
    expect(screen.getByTestId('preview').textContent).toBe('水')

    fireEvent.click(screen.getByRole('button', { name: 'duplicates.ignore' }))
    expect(onIgnore).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'duplicates.cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('удаляет дубликат после подтверждения', () => {
    render(
      <DuplicateCardsDialog cards={cards} onIgnore={() => {}} onCancel={() => {}} />,
    )

    fireEvent.click(
      screen.getAllByRole('button', { name: 'duplicates.deleteAria' })[0],
    )
    expect(screen.getByText('duplicates.deleteText')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'duplicates.deleteAction' }))

    expect(update).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('水')).toBeNull()
    expect(screen.getByText('火')).toBeTruthy()
  })
})
