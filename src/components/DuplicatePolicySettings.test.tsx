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
  ignoreAll: false,
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

  it('большой переключатель отключает обе колонки', () => {
    render(<Demo />)

    const master = screen.getByRole('checkbox', {
      name: /settings.duplicatesIgnoreAll/,
    }) as HTMLInputElement
    fireEvent.click(master)

    expect(master.checked).toBe(true)
    for (const radio of screen.getAllByRole('radio') as HTMLInputElement[]) {
      expect(radio.disabled).toBe(true)
    }
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
