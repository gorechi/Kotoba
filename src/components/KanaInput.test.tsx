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

  it('принимает кириллицу', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'ку')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('く')
  })

  it('принимает чи как ち', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'кочира')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('こちら')
  })

  it('удлиняет гласную повтором', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'каа')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('かー')
  })

  it('понимает разделитель для ん', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'нъа')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('んあ')
  })

  it('доканчивает висящую н при уходе из поля', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'кун')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('くн')

    await user.tab()
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('くん')
  })

  it('учитывает режим для ди', async () => {
    const user = userEvent.setup()
    render(<Harness mode="katakana" />)

    await user.type(screen.getByRole('textbox'), 'ди')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('ディ')
  })
})
