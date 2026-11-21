import { describe, expect, it } from 'vitest'
import {
  convertForModeSwitch,
  convertRomajiTail,
  convertRomajiText,
  extraSigns,
  finalizeRomajiTail,
  guessKanaMode,
  suggestReading,
} from './romaji'

describe('guessKanaMode', () => {
  it('определяет раскладку по тексту', () => {
    expect(guessKanaMode('カタカナ')).toBe('katakana')
    expect(guessKanaMode('ひらがな')).toBe('hiragana')
    expect(guessKanaMode('かなカナ')).toBe('hiragana')
  })

  it('возвращает запасной режим для латиницы и пустого текста', () => {
    expect(guessKanaMode('abc')).toBe('hiragana')
    expect(guessKanaMode('abc', 'katakana')).toBe('katakana')
    expect(guessKanaMode(undefined, 'abc')).toBe('abc')
    expect(guessKanaMode('')).toBe('hiragana')
  })
})

describe('extraSigns', () => {
  it('не предлагает дополнительные знаки в режиме abc', () => {
    expect(extraSigns('abc')).toEqual([])
  })

  it('предлагает знаки для выбранной каны', () => {
    expect(extraSigns('hiragana')).toContain('っ')
    expect(extraSigns('hiragana')).toContain('ー')
    expect(extraSigns('katakana')).toContain('ッ')
  })
})

describe('convertRomajiTail', () => {
  it('превращает латинский хвост в кану', () => {
    expect(convertRomajiTail('ka', 'hiragana')).toBe('か')
    expect(convertRomajiTail('kana', 'hiragana')).toBe('かな')
    expect(convertRomajiTail('ka', 'katakana')).toBe('カ')
  })

  it('сразу превращает конечную n в ん', () => {
    expect(convertRomajiTail('kan', 'hiragana')).toBe('かん')
  })

  it('переосмысляет ん как начало слога при вводе гласной', () => {
    expect(convertRomajiTail('かんa', 'hiragana')).toBe('かな')
    expect(convertRomajiTail('かんya', 'hiragana')).toBe('かにゃ')
  })

  it('правильно обрабатывает nn', () => {
    expect(convertRomajiTail('konnichiha', 'hiragana')).toBe('こんにちは')
  })

  it('не трогает готовые знаки', () => {
    expect(convertRomajiTail('かな', 'hiragana')).toBe('かな')
  })

  it('возвращает ввод без изменений в режиме abc', () => {
    expect(convertRomajiTail('kana', 'abc')).toBe('kana')
    expect(convertRomajiTail('', 'hiragana')).toBe('')
  })
})

describe('finalizeRomajiTail', () => {
  it('доканчивает хвост без режима IME', () => {
    expect(finalizeRomajiTail('ka', 'hiragana')).toBe('か')
    expect(finalizeRomajiTail('kan', 'hiragana')).toBe('かん')
    expect(finalizeRomajiTail('ka', 'katakana')).toBe('カ')
  })

  it('не меняет готовую кану и режим abc', () => {
    expect(finalizeRomajiTail('かな', 'hiragana')).toBe('かな')
    expect(finalizeRomajiTail('kana', 'abc')).toBe('kana')
  })
})

describe('convertRomajiText', () => {
  it('переводит всю латиницу в кану', () => {
    expect(convertRomajiText('kana', 'hiragana')).toBe('かな')
    expect(convertRomajiText('kana', 'katakana')).toBe('カナ')
    expect(convertRomajiText('kana', 'abc')).toBe('kana')
  })
})

describe('convertForModeSwitch', () => {
  it('переводит латиницу в выбранную кану', () => {
    expect(convertForModeSwitch('kana', 'abc', 'hiragana')).toBe('かな')
  })

  it('переводит одну кану в другую', () => {
    expect(convertForModeSwitch('かな', 'hiragana', 'katakana')).toBe('カナ')
    expect(convertForModeSwitch('カナ', 'katakana', 'hiragana')).toBe('かな')
  })

  it('не трогает текст при том же режиме', () => {
    expect(convertForModeSwitch('かな', 'hiragana', 'hiragana')).toBe('かな')
  })
})

describe('suggestReading', () => {
  it('подсказывает ромадзи по кане', () => {
    expect(suggestReading('みず')).toBe('mizu')
    expect(suggestReading('かn')).toBe('kan')
  })

  it('молчит, если в тексте есть кандзи', () => {
    expect(suggestReading('食べる')).toBe('')
  })

  it('возвращает пустую строку для пустого ввода', () => {
    expect(suggestReading('')).toBe('')
  })
})
