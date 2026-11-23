// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SpeakButton } from './SpeakButton'
import { speakJa } from '../lib/tts'

vi.mock('../lib/tts', () => ({
  speakJa: vi.fn(async () => ({ ok: true })),
}))

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

afterEach(cleanup)

describe('SpeakButton', () => {
  it('озвучивает переданный текст', () => {
    render(<SpeakButton text="水を飲む" label="Прослушать пример" />)

    fireEvent.click(screen.getByRole('button', { name: 'Прослушать пример' }))

    expect(speakJa).toHaveBeenCalledWith('水を飲む')
  })

  it('без подписи использует стандартную', () => {
    render(<SpeakButton text="水" />)

    expect(screen.getByRole('button', { name: 'session.listen' })).toBeTruthy()
  })

  it('не переворачивает карточку, если лежит поверх кликабельной области', () => {
    const parentClick = vi.fn()
    render(
      <div onClick={parentClick}>
        <SpeakButton text="水" />
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'session.listen' }))

    expect(parentClick).not.toHaveBeenCalled()
  })
})
