// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KanaInput } from './KanaInput'

vi.mock('../lib/i18n-react', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

function Harness({ mode = 'hiragana' }: { mode?: 'hiragana' | 'katakana' }) {
  const [value, setValue] = useState('')
  return (
    <KanaInput
      id="kana"
      value={value}
      onChange={setValue}
      mode={mode}
      onModeChange={() => {}}
      simple
    />
  )
}

afterEach(cleanup)

describe('KanaInput', () => {
  it('переводит латинские знаки препинания в японские', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'hai, genki desu.')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
      'はい、 げんき です。',
    )
  })

  it('работает с катаканой', async () => {
    const user = userEvent.setup()
    render(<Harness mode="katakana" />)

    await user.type(screen.getByRole('textbox'), 'genki?')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('ゲンキ？')
  })
})
