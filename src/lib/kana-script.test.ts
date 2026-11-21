import { describe, expect, it } from 'vitest'
import { detectKanaScript } from './kana-script'

describe('detectKanaScript', () => {
  it('распознаёт чистую хирагану', () => {
    expect(detectKanaScript('ひらがな')).toBe('hiragana')
    expect(detectKanaScript('ありがとう ございます')).toBe('hiragana')
    expect(detectKanaScript('おはよう！')).toBe('hiragana')
    expect(detectKanaScript('こんにちは。')).toBe('hiragana')
  })

  it('распознаёт чистую катакану', () => {
    expect(detectKanaScript('カタカナ')).toBe('katakana')
    expect(detectKanaScript('コンピューター')).toBe('katakana')
    expect(detectKanaScript('「テスト」')).toBe('katakana')
    expect(detectKanaScript('ｱｲｳ')).toBe('katakana')
  })

  it('считает долгий звук и пунктуацию нейтральными', () => {
    expect(detectKanaScript('らーめん')).toBe('hiragana')
    expect(detectKanaScript('ラーメン')).toBe('katakana')
    expect(detectKanaScript('カタカナ・テスト')).toBe('katakana')
  })

  it('определяет смешанные карточки', () => {
    expect(detectKanaScript('ひらがなとカタカナ')).toBe('mixed')
  })

  it('понимает знаки итерации и другие знаки письменностей', () => {
    expect(detectKanaScript('ゝ')).toBe('hiragana')
    expect(detectKanaScript('ヽ')).toBe('katakana')
  })

  it('не считает эмодзи частью каны', () => {
    expect(detectKanaScript('カナ😀')).toBeNull()
  })

  it('не ставит письменность для кандзи, латиницы и цифр', () => {
    expect(detectKanaScript('食べる')).toBeNull()
    expect(detectKanaScript('日本語')).toBeNull()
    expect(detectKanaScript('hello')).toBeNull()
    expect(detectKanaScript('123')).toBeNull()
    expect(detectKanaScript('')).toBeNull()
    expect(detectKanaScript('ー')).toBeNull()
    expect(detectKanaScript('　')).toBeNull()
  })
})
