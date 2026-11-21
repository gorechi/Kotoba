import { describe, expect, it } from 'vitest'
import { detectDelimiter, parseDelimited, readDelimitedFile } from './delimited'

describe('detectDelimiter', () => {
  it('распознаёт запятую, точку с запятой и табуляцию', () => {
    expect(detectDelimiter('word,reading\nねこ,neko')).toBe(',')
    expect(detectDelimiter('word;reading\nねこ;neko')).toBe(';')
    expect(detectDelimiter('word\treading\nねこ\tneko')).toBe('\t')
  })

  it('не считает разделители внутри кавычек', () => {
    expect(detectDelimiter('"a,b";c\n"d,e";f')).toBe(';')
  })

  it('игнорирует BOM и пустые строки', () => {
    expect(detectDelimiter('\uFEFFa,b\n\n1,2\n')).toBe(',')
  })

  it('возвращает запятую для пустого текста', () => {
    expect(detectDelimiter('')).toBe(',')
    expect(detectDelimiter('одна колонка\nвторая строка')).toBe(',')
  })
})

describe('parseDelimited', () => {
  it('разбирает простые строки', () => {
    expect(parseDelimited('a,b\n1,2', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('понимает кавычки и разделители внутри полей', () => {
    expect(parseDelimited('"a,b",c', ',')).toEqual([['a,b', 'c']])
  })

  it('разэкранирует двойные кавычки', () => {
    expect(parseDelimited('"он сказал ""да""",b', ',')).toEqual([
      ['он сказал "да"', 'b'],
    ])
  })

  it('сохраняет переводы строк внутри кавычек', () => {
    expect(parseDelimited('"первая\nвторая",b', ',')).toEqual([
      ['первая\nвторая', 'b'],
    ])
  })

  it('понимает CRLF и не добавляет пустую строку в конце', () => {
    expect(parseDelimited('a,b\r\n1,2\r\n', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('сохраняет пустые поля', () => {
    expect(parseDelimited('a,,c', ',')).toEqual([['a', '', 'c']])
  })

  it('снимает BOM', () => {
    expect(parseDelimited('\uFEFFa,b', ',')).toEqual([['a', 'b']])
  })

  it('возвращает пустой массив для пустого текста', () => {
    expect(parseDelimited('', ',')).toEqual([])
  })
})

describe('readDelimitedFile', () => {
  it('читает UTF-8', async () => {
    const file = new File(['слово,чтение'], 'cards.csv', { type: 'text/csv' })
    await expect(readDelimitedFile(file)).resolves.toBe('слово,чтение')
  })

  it('читает UTF-16LE с BOM', async () => {
    const text = '\uFEFFслово,чтение'
    const bytes = new Uint8Array(text.length * 2)
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i)
      bytes[i * 2] = code & 0xff
      bytes[i * 2 + 1] = code >> 8
    }
    const file = new File([bytes], 'cards.csv')
    await expect(readDelimitedFile(file)).resolves.toBe('слово,чтение')
  })

  it('падает обратно на windows-1251 для старых файлов Excel', async () => {
    const cp1251 = new Uint8Array([0xcf, 0xf0, 0xe8, 0xe2, 0xe5, 0xf2])
    const file = new File([cp1251], 'cards.csv')
    await expect(readDelimitedFile(file)).resolves.toBe('Привет')
  })
})
