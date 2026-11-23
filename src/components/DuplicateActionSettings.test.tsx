// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DuplicateActionSettings } from './DuplicateActionSettings'
import type { DuplicateAction } from '../types'

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

function Demo() {
  const [value, setValue] = useState<DuplicateAction>('ask')
  return <DuplicateActionSettings value={value} onChange={setValue} />
}

function radio(key: string) {
  return screen.getByRole('radio', { name: new RegExp(key) }) as HTMLInputElement
}

afterEach(cleanup)

describe('DuplicateActionSettings', () => {
  it('по умолчанию выбирает «Спрашивать»', () => {
    render(<Demo />)

    expect(screen.getByRole('radiogroup', { name: 'settings.duplicatesQuestion' })).toBeTruthy()
    expect(radio('settings.duplicatesActionAsk').checked).toBe(true)
  })

  it('переключает действие и показывает пояснение', () => {
    render(<Demo />)

    fireEvent.click(radio('settings.duplicatesActionDeny'))

    expect(radio('settings.duplicatesActionDeny').checked).toBe(true)
    expect(radio('settings.duplicatesActionAsk').checked).toBe(false)
    expect(
      screen.getByText('settings.duplicatesDenyHint'),
    ).toBeTruthy()
  })
})
