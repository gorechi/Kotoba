// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CardPreview } from './CardPreview'
import { makeCard, makeDeck } from '../test/factories'

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('../lib/tts', () => ({
  speakJa: vi.fn(async () => ({ ok: true })),
}))

afterEach(cleanup)

describe('CardPreview', () => {
  it('показывает карточку и кнопки озвучки примеров', () => {
    const card = makeCard({
      front: '水',
      reading: 'みず',
      examples: [
        { id: 'example-1', text: '水を飲む', transcription: 'mizu o nomu', translation: 'пить воду' },
      ],
    })

    render(<CardPreview card={card} deck={makeDeck({ name: 'Кандзи' })} onClose={() => {}} />)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('水')).toBeTruthy()
    expect(screen.getByText('browser.previewTitle')).toBeTruthy()
    expect(screen.getByText('Кандзи')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'session.listenExample' })).toBeTruthy()
  })
})
