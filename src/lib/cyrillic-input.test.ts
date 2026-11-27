import { describe, expect, it } from 'vitest'
import {
  convertCyrillicInput,
  convertKanaInput,
  finalizeKanaInput,
} from './cyrillic-input'

describe('convertCyrillicInput', () => {
  it('переводит базовые слоги', () => {
    expect(convertCyrillicInput('ку', 'hiragana')).toBe('く')
    expect(convertCyrillicInput('си', 'hiragana')).toBe('し')
    expect(convertCyrillicInput('ши', 'hiragana')).toBe('し')
    expect(convertCyrillicInput('ти', 'hiragana')).toBe('ち')
    expect(convertCyrillicInput('чи', 'hiragana')).toBe('ち')
    expect(convertCyrillicInput('цу', 'hiragana')).toBe('つ')
    expect(convertCyrillicInput('фу', 'hiragana')).toBe('ふ')
    expect(convertCyrillicInput('дзи', 'hiragana')).toBe('じ')
    expect(convertCyrillicInput('дзя', 'hiragana')).toBe('じゃ')
  })

  it('собирает слово из привычной русской записи', () => {
    expect(convertCyrillicInput('кочира', 'hiragana')).toBe('こちら')
  })

  it('переводит текст в катакану', () => {
    expect(convertCyrillicInput('ку', 'katakana')).toBe('ク')
    expect(convertCyrillicInput('си', 'katakana')).toBe('シ')
    expect(convertCyrillicInput('дзя', 'katakana')).toBe('ジャ')
  })

  it('различает ぢ/づ и ディ/ドゥ по режиму', () => {
    expect(convertCyrillicInput('ди', 'hiragana')).toBe('ぢ')
    expect(convertCyrillicInput('ду', 'hiragana')).toBe('づ')
    expect(convertCyrillicInput('ди', 'katakana')).toBe('ディ')
    expect(convertCyrillicInput('ду', 'katakana')).toBe('ドゥ')
  })

  it('использует во для を', () => {
    expect(convertCyrillicInput('во', 'hiragana')).toBe('を')
    expect(convertCyrillicInput('во', 'katakana')).toBe('ヲ')
  })

  it('понимает ёон и малые гласные', () => {
    expect(convertCyrillicInput('кя', 'hiragana')).toBe('きゃ')
    expect(convertCyrillicInput('сё', 'hiragana')).toBe('しょ')
    expect(convertCyrillicInput('тю', 'hiragana')).toBe('ちゅ')
    expect(convertCyrillicInput('фа', 'katakana')).toBe('ファ')
    expect(convertCyrillicInput('че', 'katakana')).toBe('チェ')
  })

  it('делает っ из удвоенной согласной', () => {
    expect(convertCyrillicInput('кка', 'hiragana')).toBe('っか')
    expect(convertCyrillicInput('гаккоо', 'hiragana')).toBe('がっこー')
    expect(convertCyrillicInput('кка', 'katakana')).toBe('ッカ')
  })

  it('удлиняет гласную повтором или двоеточием', () => {
    expect(convertCyrillicInput('каа', 'hiragana')).toBe('かー')
    expect(convertCyrillicInput('коо', 'katakana')).toBe('コー')
    expect(convertCyrillicInput('ка:', 'hiragana')).toBe('かー')
    expect(convertCyrillicInput('кааа', 'hiragana')).toBe('かーあ')
  })

  it('понимает ん перед гласной через разделители', () => {
    expect(convertCyrillicInput('на', 'hiragana')).toBe('な')
    expect(convertCyrillicInput('нъа', 'hiragana')).toBe('んあ')
    expect(convertCyrillicInput("н'а", 'hiragana')).toBe('んあ')
    expect(convertCyrillicInput('н-а', 'hiragana')).toBe('んあ')
  })

  it('оставляет незавершённый хвост кириллицей', () => {
    expect(convertCyrillicInput('кун', 'hiragana')).toBe('くн')
    expect(convertCyrillicInput('к', 'hiragana')).toBe('к')
    expect(convertCyrillicInput('кука', 'hiragana')).toBe('くか')
  })

  it('не трогает латиницу и готовые знаки', () => {
    expect(convertCyrillicInput('куka', 'hiragana')).toBe('くka')
    expect(convertCyrillicInput('かな', 'hiragana')).toBe('かな')
    expect(convertCyrillicInput('КУ', 'hiragana')).toBe('く')
  })
})

describe('convertKanaInput', () => {
  it('добавляет к кириллице латиницу и пунктуацию', () => {
    expect(convertKanaInput('ку, ', 'hiragana')).toBe('く、 ')
    expect(convertKanaInput('кун,', 'hiragana')).toBe('くん、')
    expect(convertKanaInput('куka', 'hiragana')).toBe('くか')
  })
})

describe('finalizeKanaInput', () => {
  it('доканчивает висящую н при уходе из поля', () => {
    expect(finalizeKanaInput('кун', 'hiragana')).toBe('くん')
    expect(finalizeKanaInput('кун', 'katakana')).toBe('クン')
    expect(finalizeKanaInput('ку', 'hiragana')).toBe('く')
  })
})
