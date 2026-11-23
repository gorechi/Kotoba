// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { DuplicatePolicySettings } from './DuplicatePolicySettings'
import type { DuplicatePolicy } from '../types'

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const DEFAULT: DuplicatePolicy = {
  withinDeck: 'ask',
  acrossDecks: 'ignore',
}

function Demo() {
  const [value, setValue] = useState<DuplicatePolicy>(DEFAULT)
  return <DuplicatePolicySettings value={value} onChange={setValue} />
}

function group(key: string) {
  return screen.getByRole('group', { name: key })
}

afterEach(cleanup)

describe('DuplicatePolicySettings', () => {
  it('по умолчанию ставит «Спрашивать» внутри колоды и «Игнорировать» во всех', () => {
    render(<Demo />)

    expect(
      (within(group('settings.duplicatesWithinTitle')).getByRole('radio', {
        name: 'settings.duplicatesActionAsk',
      }) as HTMLInputElement).checked,
    ).toBe(true)
    expect(
      (within(group('settings.duplicatesAcrossTitle')).getByRole('radio', {
        name: 'settings.duplicatesActionIgnore',
      }) as HTMLInputElement).checked,
    ).toBe(true)
  })

  it('позволяет выбрать действие в каждой колонке отдельно', () => {
    render(<Demo />)

    fireEvent.click(
      within(group('settings.duplicatesWithinTitle')).getByRole('radio', {
        name: 'settings.duplicatesActionDeny',
      }),
    )
    fireEvent.click(
      within(group('settings.duplicatesAcrossTitle')).getByRole('radio', {
        name: 'settings.duplicatesActionAsk',
      }),
    )

    expect(
      (within(group('settings.duplicatesWithinTitle')).getByRole('radio', {
        name: 'settings.duplicatesActionDeny',
      }) as HTMLInputElement).checked,
    ).toBe(true)
    expect(
      (within(group('settings.duplicatesAcrossTitle')).getByRole('radio', {
        name: 'settings.duplicatesActionAsk',
      }) as HTMLInputElement).checked,
    ).toBe(true)
  })
})
