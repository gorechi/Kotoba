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

  it('обрабатывает заимствованные сочетания с малыми гласными', () => {
    expect(toCyrillic('チェ')).toBe('чэ')
    expect(toCyrillic('アームチェア')).toBe('а:-му-чэ-а')
    expect(toCyrillic('シェ')).toBe('шэ')
    expect(toCyrillic('ジェ')).toBe('дзэ')
    expect(toCyrillic('ファ')).toBe('фа')
    expect(toCyrillic('ティ')).toBe('ти')
    expect(toCyrillic('ウィ')).toBe('ви')
    expect(toCyrillic('クァ')).toBe('ква')
    expect(toCyrillic('ツァ')).toBe('ца')
    expect(toCyrillic('ヴァ')).toBe('ва')
  })

  it('разделяет слова пробелом без лишних дефисов', () => {
    expect(toCyrillic('したの なまえ')).toBe('ши-та-но на-ма-э')
    expect(toCyrillic('したの　なまえ')).toBe('ши-та-но на-ма-э')
    expect(toCyrillic(' したの  なまえ ')).toBe('ши-та-но на-ма-э')
  })

  it('не удваивает согласную перед гласной', () => {
    expect(toCyrillic('っあ')).toBe('а')
  })

  it('приводит катакану к тем же правилам', () => {
    expect(toCyrillic('ラーメン')).toBe('ра:-мэ-н')
  })
})
