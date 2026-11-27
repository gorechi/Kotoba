import { describe, expect, it } from 'vitest'
import { addText, createTextDocument } from './texts'
import { makeData } from '../test/factories'

describe('createTextDocument', () => {
  it('обрезает внешние пробелы и сохраняет дату', () => {
    const text = createTextDocument('  Название ', '  Текст  ', 123)
    expect(text.id).toMatch(/^text-/)
    expect(text.title).toBe('Название')
    expect(text.body).toBe('Текст')
    expect(text.createdAt).toBe(123)
  })
})

describe('addText', () => {
  it('добавляет текст в начало библиотеки', () => {
    const old = createTextDocument('Старый', 'Текст', 1)
    const data = makeData({ texts: [old] })

    const next = addText(data, 'Новый', 'Другой текст', 2)

    expect(next.texts).toHaveLength(2)
    expect(next.texts[0]).toMatchObject({ title: 'Новый', body: 'Другой текст' })
    expect(next.texts[1]).toBe(old)
  })
})
