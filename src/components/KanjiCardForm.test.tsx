// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { KanjiCardForm } from './KanjiCardForm'

vi.mock('../state/store', () => {
  const data = {
    decks: [],
    cards: [],
    settings: { defaultTranscription: 'romaji' },
  }

  return {
    useStore: () => ({
      data,
      update: vi.fn(),
      trackWork: vi.fn(),
    }),
  }
})

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('./FitText', () => ({
  FitText: () => null,
}))

afterEach(cleanup)

describe('KanjiCardForm', () => {
  it('использует свой выпадающий список для JLPT', () => {
    render(<KanjiCardForm deckId="deck-1" onClose={() => {}} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('select')).toBeNull()
    expect(dialog.querySelector('#kanji-jlpt')?.closest('.select')).toBeTruthy()
  })
})
