// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'

afterEach(cleanup)

function renderSelect(props: { disabled?: boolean; onChange?: (value: string) => void } = {}) {
  return render(
    <Select
      value="a"
      disabled={props.disabled}
      aria-label="Письменность"
      onChange={(event) => props.onChange?.(event.target.value)}
    >
      <option value="a">Хирагана</option>
      <option value="b">Катакана</option>
      <option value="c" disabled>
        Смешанная
      </option>
    </Select>,
  )
}

describe('Select', () => {
  it('показывает выбранное значение', () => {
    renderSelect()
    expect(screen.getByRole('button', { name: 'Письменность' }).textContent).toBe('Хирагана')
  })

  it('открывается по клику и выбирает пункт', () => {
    const onChange = vi.fn()
    renderSelect({ onChange })

    fireEvent.click(screen.getByRole('button', { name: 'Письменность' }))
    expect(screen.getByRole('listbox')).toBeTruthy()

    fireEvent.click(screen.getByRole('option', { name: 'Катакана' }))

    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('помечает выбранный пункт', () => {
    renderSelect()
    fireEvent.click(screen.getByRole('button', { name: 'Письменность' }))

    expect(screen.getByRole('option', { name: 'Хирагана' }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(
      screen.getByRole('option', { name: 'Катакана' }).getAttribute('aria-selected'),
    ).toBe('false')
  })

  it('пропускает отключённые пункты при навигации с клавиатуры', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderSelect({ onChange })
    const trigger = screen.getByRole('button', { name: 'Письменность' })

    await user.click(trigger)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('option', { name: 'Катакана' }).className).toContain('is-active')

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('закрывается по Escape', () => {
    renderSelect()
    const trigger = screen.getByRole('button', { name: 'Письменность' })

    fireEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeTruthy()

    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('не закрывается при прокрутке списка', () => {
    renderSelect()
    fireEvent.click(screen.getByRole('button', { name: 'Письменность' }))
    const listbox = screen.getByRole('listbox')

    fireEvent.scroll(listbox)
    fireEvent.pointerDown(listbox)

    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('не открывается, если отключён', () => {
    renderSelect({ disabled: true })
    fireEvent.click(screen.getByRole('button', { name: 'Письменность' }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
