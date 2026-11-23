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

  it('скрывает плейсхолдер в меню, но оставляет его в кнопке', () => {
    render(
      <Select value="" aria-label="Колода" onChange={() => {}}>
        <option value="" disabled>
          Перенести в…
        </option>
        <option value="a">Хирагана</option>
      </Select>,
    )

    const trigger = screen.getByRole('button', { name: 'Колода' })
    expect(trigger.textContent).toBe('Перенести в…')

    fireEvent.click(trigger)

    expect(screen.queryByRole('option', { name: 'Перенести в…' })).toBeNull()
    expect(screen.getByRole('option', { name: 'Хирагана' })).toBeTruthy()
  })

  it('не скрывает пустой пункт, если это настоящий выбор', () => {
    render(
      <Select value="" aria-label="Колода" onChange={() => {}}>
        <option value="">Все колоды</option>
        <option value="a">Хирагана</option>
      </Select>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Колода' }))

    expect(screen.getByRole('option', { name: 'Все колоды' })).toBeTruthy()
  })

  it('не открывается, если отключён', () => {
    renderSelect({ disabled: true })
    fireEvent.click(screen.getByRole('button', { name: 'Письменность' }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
