import { describe, expect, it } from 'vitest'
import { addText, createTextDocument } from './texts'
import { makeCard, makeData } from '../test/factories'

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

  it('сразу связывает текст с существующими карточками', () => {
    const card = makeCard({ id: 'card-1', front: 'はい' })
    const data = makeData({ cards: [card] })

    const next = addText(data, 'Приветствие', 'はい、はい', 2)

    expect(next.texts[0].marks).toEqual([
      { start: 0, end: 2, cardIds: ['card-1'] },
      { start: 3, end: 5, cardIds: ['card-1'] },
    ])
  })
})
