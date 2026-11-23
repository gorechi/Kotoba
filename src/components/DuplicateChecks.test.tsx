// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DuplicateChecks } from './DuplicateChecks'
import type { DuplicateCheck } from '../types'

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

function Demo() {
  const [value, setValue] = useState<DuplicateCheck[]>(['ignore'])
  return <DuplicateChecks value={value} onChange={setValue} />
}

function checkbox(key: string) {
  return screen.getByRole('checkbox', { name: new RegExp(key) }) as HTMLInputElement
}

afterEach(cleanup)

describe('DuplicateChecks', () => {
  it('при «не обращать внимания» блокирует остальные варианты', () => {
    render(<Demo />)

    expect(checkbox('settings.duplicatesIgnore').checked).toBe(true)
    expect(checkbox('settings.duplicatesAskDeck').disabled).toBe(true)
    expect(checkbox('settings.duplicatesDenyAll').disabled).toBe(true)
  })

  it('снимает противоположный вариант внутри пары', () => {
    render(<Demo />)

    fireEvent.click(checkbox('settings.duplicatesIgnore'))
    fireEvent.click(checkbox('settings.duplicatesAskDeck'))
    expect(checkbox('settings.duplicatesAskDeck').checked).toBe(true)

    fireEvent.click(checkbox('settings.duplicatesDenyDeck'))
    expect(checkbox('settings.duplicatesDenyDeck').checked).toBe(true)
    expect(checkbox('settings.duplicatesAskDeck').checked).toBe(false)
  })

  it('при включении «не обращать внимания» очищает остальные', () => {
    render(<Demo />)

    fireEvent.click(checkbox('settings.duplicatesIgnore'))
    fireEvent.click(checkbox('settings.duplicatesAskDeck'))
    fireEvent.click(checkbox('settings.duplicatesAskAll'))
    fireEvent.click(checkbox('settings.duplicatesIgnore'))

    expect(checkbox('settings.duplicatesIgnore').checked).toBe(true)
    expect(checkbox('settings.duplicatesAskDeck').checked).toBe(false)
    expect(checkbox('settings.duplicatesAskAll').checked).toBe(false)
    expect(checkbox('settings.duplicatesAskDeck').disabled).toBe(true)
  })
})
