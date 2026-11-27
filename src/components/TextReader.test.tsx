// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TextReader } from './TextReader'
import { createTextDocument } from '../lib/texts'
import { makeCard, makeData, makeDeck } from '../test/factories'

const { store } = vi.hoisted(() => ({
  store: {
    data: null as unknown,
    update: vi.fn(),
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

afterEach(cleanup)

describe('TextReader', () => {
  it('переключает режим карточек и показывает перевод по нажатию', () => {
    const deck = makeDeck({ id: 'deck-1', name: 'Тест' })
    const card = makeCard({
      id: 'card-1',
      deckId: 'deck-1',
      front: 'はい',
      meaning: 'да',
    })
    store.data = makeData({
      decks: [deck],
      cards: [card],
      texts: [createTextDocument('Текст', 'はい、はい', 1)],
    })
    const text = (store.data as ReturnType<typeof makeData>).texts[0]

    render(<TextReader text={text} onBack={() => {}} />)

    expect(screen.getByText('はい、はい')).toBeTruthy()
    fireEvent.click(screen.getByText('texts.cardsMode'))

    const marks = document.querySelectorAll('.text-mark')
    expect(marks).toHaveLength(2)
    fireEvent.click(marks[0])

    expect(screen.getByText('да')).toBeTruthy()
    expect(screen.getByText('Тест')).toBeTruthy()
  })
})
