import { describe, expect, it } from 'vitest'
import {
  convertForModeSwitch,
  convertRomajiTail,
  extraSigns,
  finalizeRomajiTail,
  guessKanaMode,
  kanaModes,
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
    expect(guessKanaMode(undefined, 'katakana')).toBe('katakana')
    expect(guessKanaMode('')).toBe('hiragana')
  })
})

describe('kanaModes', () => {
  it('предлагает только хирагану и катакану', () => {
    expect(kanaModes().map((item) => item.mode)).toEqual(['hiragana', 'katakana'])
  })
})

describe('extraSigns', () => {
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

  it('убирает служебный апостроф после превращения', () => {
    expect(convertRomajiTail("ten'in", 'hiragana')).toBe('てんいん')
    expect(convertRomajiTail("てん'い", 'hiragana')).toBe('てんい')
  })

  it('не трогает готовые знаки', () => {
    expect(convertRomajiTail('かな', 'hiragana')).toBe('かな')
  })

  it('возвращает пустой ввод без изменений', () => {
    expect(convertRomajiTail('', 'hiragana')).toBe('')
  })

  it('переводит знаки препинания в японские по всей строке', () => {
    expect(convertRomajiTail('はい,', 'hiragana')).toBe('はい、')
    expect(convertRomajiTail('はい, ', 'hiragana')).toBe('はい、 ')
    expect(convertRomajiTail('はい.げんき', 'hiragana')).toBe('はい。げんき')
    expect(convertRomajiTail('はい?', 'hiragana')).toBe('はい？')
    expect(convertRomajiTail('はい!', 'hiragana')).toBe('はい！')
    expect(convertRomajiTail('はい;', 'hiragana')).toBe('はい；')
  })

  it('доканчивает «n» перед знаком препинания', () => {
    expect(convertRomajiTail('kan,', 'hiragana')).toBe('かん、')
    expect(convertRomajiTail('kan?', 'hiragana')).toBe('かん？')
  })
})

describe('finalizeRomajiTail', () => {
  it('доканчивает хвост без режима IME', () => {
    expect(finalizeRomajiTail('ka', 'hiragana')).toBe('か')
    expect(finalizeRomajiTail('kan', 'hiragana')).toBe('かん')
    expect(finalizeRomajiTail('ka', 'katakana')).toBe('カ')
  })

  it('не меняет готовую кану', () => {
    expect(finalizeRomajiTail('かな', 'hiragana')).toBe('かな')
  })

  it('убирает служебные апострофы при завершении ввода', () => {
    expect(finalizeRomajiTail("てん'いん", 'hiragana')).toBe('てんいん')
    expect(finalizeRomajiTail("てん'", 'hiragana')).toBe('てん')
  })

  it('японизирует знаки препинания при завершении ввода', () => {
    expect(finalizeRomajiTail('はい, げんき', 'hiragana')).toBe('はい、 げんき')
    expect(finalizeRomajiTail('はい.', 'hiragana')).toBe('はい。')
  })
})

describe('convertForModeSwitch', () => {
  it('переводит одну кану в другую', () => {
    expect(convertForModeSwitch('かな', 'hiragana', 'katakana')).toBe('カナ')
    expect(convertForModeSwitch('カナ', 'katakana', 'hiragana')).toBe('かな')
  })

  it('не трогает текст при том же режиме', () => {
    expect(convertForModeSwitch('かな', 'hiragana', 'hiragana')).toBe('かな')
  })

  it('сохраняет знаки препинания при смене режима', () => {
    expect(convertForModeSwitch('はい,', 'hiragana', 'katakana')).toBe('ハイ、')
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

  it('понимает кану со знаками препинания', () => {
    expect(suggestReading('はい、 げんきです。')).toBe('hai, genkidesu.')
    expect(suggestReading('はい, げんきです。')).toBe('hai, genkidesu.')
  })

  it('возвращает пустую строку для пустого ввода', () => {
    expect(suggestReading('')).toBe('')
  })
})
