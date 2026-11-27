// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Texts } from './Texts'
import { createTextDocument } from '../lib/texts'

const { store } = vi.hoisted(() => ({
  store: {
    data: { texts: [] as unknown[], cards: [] as unknown[], decks: [] as unknown[] },
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

beforeEach(() => {
  store.data = { texts: [], cards: [], decks: [] }
  store.update.mockClear()
  store.trackWork.mockClear()
})

afterEach(cleanup)

describe('Texts', () => {
  it('показывает форму только после нажатия «Загрузить текст»', () => {
    render(<Texts />)

    expect(screen.queryByLabelText('texts.nameLabel')).toBeNull()
    fireEvent.click(screen.getByText('texts.new'))
    expect(screen.getByLabelText('texts.nameLabel')).toBeTruthy()
  })

  it('показывает пустую карточку создания текста', () => {
    render(<Texts />)

    fireEvent.click(screen.getByText('texts.newCardTitle'))
    expect(screen.getByLabelText('texts.nameLabel')).toBeTruthy()
  })

  it('добавляет вставленный текст', () => {
    render(<Texts />)
    fireEvent.click(screen.getByText('texts.new'))

    fireEvent.change(screen.getByLabelText('texts.nameLabel'), {
      target: { value: 'Тест' },
    })
    fireEvent.change(screen.getByLabelText('texts.bodyLabel'), {
      target: { value: 'こんにちは' },
    })
    fireEvent.click(screen.getByText('texts.add'))

    expect(store.update).toHaveBeenCalledTimes(1)
    const update = store.update.mock.calls[0][0] as (current: unknown) => {
      texts: { title: string; body: string }[]
    }
    const next = update(store.data)
    expect(next.texts[0]).toMatchObject({ title: 'Тест', body: 'こんにちは' })
    expect(store.trackWork).toHaveBeenCalledTimes(1)
  })

  it('требует название и текст', () => {
    render(<Texts />)
    fireEvent.click(screen.getByText('texts.new'))

    fireEvent.click(screen.getByText('texts.add'))
    expect(screen.getByText('texts.nameError')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('texts.nameLabel'), {
      target: { value: 'Название' },
    })
    fireEvent.click(screen.getByText('texts.add'))
    expect(screen.getByText('texts.bodyError')).toBeTruthy()
    expect(store.update).not.toHaveBeenCalled()
  })

  it('показывает загруженные тексты карточками', () => {
    store.data = {
      texts: [createTextDocument('吾輩は猫である', '吾輩は猫である。名前はまだ無い。', 1)],
      cards: [],
      decks: [],
    }
    render(<Texts />)

    expect(screen.getByText('吾輩は猫である')).toBeTruthy()
    expect(screen.getByText(/吾輩は猫である。名前はまだ無い。/)).toBeTruthy()

    fireEvent.click(screen.getByText('吾輩は猫である'))
    expect(screen.getByText('texts.back')).toBeTruthy()
  })

  it('загружает текст из .txt файла', async () => {
    render(<Texts />)
    fireEvent.click(screen.getByText('texts.new'))
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    const file = new File(['こんにちは'], 'sample.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect((screen.getByLabelText('texts.nameLabel') as HTMLInputElement).value).toBe(
        'sample',
      )
    })
    expect((screen.getByLabelText('texts.bodyLabel') as HTMLTextAreaElement).value).toBe(
      'こんにちは',
    )
  })

  it('отклоняет файлы не .txt', () => {
    render(<Texts />)
    fireEvent.click(screen.getByText('texts.new'))
    const input = document.querySelector('input[type=file]') as HTMLInputElement

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'sample.md', { type: 'text/markdown' })] },
    })

    expect(screen.getByText('texts.fileTypeError')).toBeTruthy()
  })
})
