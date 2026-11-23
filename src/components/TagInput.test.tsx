// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TagInput } from './TagInput'

function Demo({ suggestions }: { suggestions: string[] }) {
  const [tags, setTags] = useState<string[]>([])
  return (
    <TagInput
      id="tag-input"
      label="Теги"
      tags={tags}
      suggestions={suggestions}
      onChange={setTags}
      placeholder="Добавьте тег"
      removeTitle={(tag) => `Удалить ${tag}`}
      removeAria={(tag) => `Удалить ${tag}`}
    />
  )
}

afterEach(cleanup)

describe('TagInput', () => {
  it('показывает подсказки и после добавления первого тега', () => {
    render(<Demo suggestions={['еда', 'книга', 'напитки']} />)

    const input = screen.getByRole('combobox', { name: 'Теги' })
    fireEvent.change(input, { target: { value: 'ед' } })
    fireEvent.mouseDown(screen.getByRole('option', { name: 'еда' }))

    expect(screen.getByText('еда').className).toBe('tag-chip')

    fireEvent.change(input, { target: { value: 'кн' } })
    expect(screen.getByRole('option', { name: 'книга' })).toBeTruthy()
  })

  it('ставит выбранные теги под полем, а не в него', () => {
    render(<Demo suggestions={['еда']} />)

    const field = document.querySelector('.tag-field')
    const input = screen.getByRole('combobox', { name: 'Теги' })

    fireEvent.change(input, { target: { value: 'ед' } })
    fireEvent.mouseDown(screen.getByRole('option', { name: 'еда' }))

    expect(field?.children[1]).toBe(input)
    expect(field?.children[2]?.className).toBe('tag-list')
  })

  it('рисует список подсказок в портале', () => {
    render(<Demo suggestions={['еда']} />)

    const input = screen.getByRole('combobox', { name: 'Теги' })
    fireEvent.change(input, { target: { value: 'ед' } })

    expect(screen.getByRole('listbox').parentElement).toBe(document.body)
  })
})
