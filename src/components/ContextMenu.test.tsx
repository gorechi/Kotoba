// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'
import { readClipboardText, writeClipboardText } from '../lib/clipboard'

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('../lib/clipboard', () => ({
  writeClipboardText: vi.fn(async () => true),
  readClipboardText: vi.fn(async () => ''),
}))

function selectText(element: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function openMenu(target: Element, x = 10, y = 10) {
  fireEvent.contextMenu(target, { clientX: x, clientY: y })
}

function ControlledInput() {
  const [value, setValue] = useState('hello world')
  return (
    <input
      data-testid="controlled"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

afterEach(() => {
  cleanup()
  window.getSelection()?.removeAllRanges()
})

beforeEach(() => {
  vi.mocked(writeClipboardText).mockClear()
  vi.mocked(readClipboardText).mockClear()
  vi.mocked(readClipboardText).mockResolvedValue('')
})

describe('ContextMenu', () => {
  it('копирует выделенный текст страницы', async () => {
    render(
      <>
        <p data-testid="text">Привет, мир</p>
        <ContextMenu />
      </>,
    )
    const text = screen.getByTestId('text')
    selectText(text)
    openMenu(text)

    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: /contextMenu.copy/ }))

    await waitFor(() => expect(writeClipboardText).toHaveBeenCalledWith('Привет, мир'))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('показывает действия для текстового поля', () => {
    render(
      <>
        <input data-testid="field" defaultValue="hello world" />
        <ContextMenu />
      </>,
    )
    const input = screen.getByTestId('field') as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 5)
    openMenu(input)

    expect(screen.getByRole('menuitem', { name: /contextMenu.cut/ })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /contextMenu.copy/ })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /contextMenu.paste/ })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /contextMenu.selectAll/ })).toBeTruthy()
  })

  it('вырезает выделенное из поля', async () => {
    render(
      <>
        <input data-testid="field" defaultValue="hello world" />
        <ContextMenu />
      </>,
    )
    const input = screen.getByTestId('field') as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 5)
    openMenu(input)

    fireEvent.click(screen.getByRole('menuitem', { name: /contextMenu.cut/ }))

    await waitFor(() => expect(input.value).toBe(' world'))
    expect(writeClipboardText).toHaveBeenCalledWith('hello')
  })

  it('вставляет текст из буфера в поле', async () => {
    vi.mocked(readClipboardText).mockResolvedValue('Привет')
    render(
      <>
        <input data-testid="field" defaultValue="hello world" />
        <ContextMenu />
      </>,
    )
    const input = screen.getByTestId('field') as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 5)
    openMenu(input)

    fireEvent.click(screen.getByRole('menuitem', { name: /contextMenu.paste/ }))

    await waitFor(() => expect(input.value).toBe('Привет world'))
  })

  it('обновляет контролируемое поле после вставки', async () => {
    vi.mocked(readClipboardText).mockResolvedValue('Привет')
    render(
      <>
        <ControlledInput />
        <ContextMenu />
      </>,
    )
    const input = screen.getByTestId('controlled') as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 5)
    openMenu(input)

    fireEvent.click(screen.getByRole('menuitem', { name: /contextMenu.paste/ }))

    await waitFor(() => expect(input.value).toBe('Привет world'))
  })

  it('закрывается по Escape и не открывается без выделения', () => {
    render(
      <>
        <div data-testid="plain">Просто текст</div>
        <input data-testid="field" defaultValue="hello" />
        <ContextMenu />
      </>,
    )

    openMenu(screen.getByTestId('plain'))
    expect(screen.queryByRole('menu')).toBeNull()

    openMenu(screen.getByTestId('field'))
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
