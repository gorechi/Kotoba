// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CardForm } from './CardForm'

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

describe('CardForm', () => {
  it('помечает обязательное поле и не подписывает остальные «необязательно»', () => {
    render(<CardForm deckId="deck-1" onClose={() => {}} />)

    const dialog = screen.getByRole('dialog')
    const required = dialog.querySelectorAll('.field.is-required')

    expect(required.length).toBe(1)
    expect(dialog.querySelector('.field.is-required input')?.id).toBe('card-front')
    expect(dialog.textContent).not.toContain('common.optional')
  })

  it('не показывает пояснение под тегами', () => {
    render(<CardForm deckId="deck-1" onClose={() => {}} />)

    expect(screen.getByRole('dialog').textContent).not.toContain('cardForm.tagsHint')
  })
})
