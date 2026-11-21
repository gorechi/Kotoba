import { describe, expect, it } from 'vitest'
import { toCyrillic } from './cyrillic'

describe('toCyrillic', () => {
  it('возвращает пустую строку для пустого ввода', () => {
    expect(toCyrillic('')).toBe('')
  })

  it('транскрибирует базовые слоги', () => {
    expect(toCyrillic('か')).toBe('ка')
    expect(toCyrillic('し')).toBe('ши')
    expect(toCyrillic('つ')).toBe('тсу')
    expect(toCyrillic('ん')).toBe('н')
  })

  it('склеивает слоги через дефис', () => {
    expect(toCyrillic('カタカナ')).toBe('ка-та-ка-на')
    expect(toCyrillic('さくら')).toBe('са-ку-ра')
  })

  it('удлиняет гласную перед отдельной гласной', () => {
    expect(toCyrillic('すう')).toBe('су:')
    expect(toCyrillic('とうきょう')).toBe('то:-кё:')
    expect(toCyrillic('せんせい')).toBe('сэ-н-сэ:')
  })

  it('удлиняет гласную знаком ー', () => {
    expect(toCyrillic('かー')).toBe('ка:')
  })

  it('удваивает согласную после っ', () => {
    expect(toCyrillic('っか')).toBe('к-ка')
    expect(toCyrillic('がっこう')).toBe('га-к-ко:')
  })

  it('обрабатывает сочетания с малыми я/ю/ё', () => {
    expect(toCyrillic('きょう')).toBe('кё:')
    expect(toCyrillic('しゃ')).toBe('шя')
    expect(toCyrillic('きゅ')).toBe('кю')
    expect(toCyrillic('ちょ')).toBe('чё')
    expect(toCyrillic('しょ')).toBe('шё')
  })

  it('не удваивает согласную перед гласной', () => {
    expect(toCyrillic('っあ')).toBe('а')
  })

  it('приводит катакану к тем же правилам', () => {
    expect(toCyrillic('ラーメン')).toBe('ра:-мэ-н')
  })
})
