import type { KanaScript } from '../types'

/**
 * Определяет письменность японского текста.
 *
 * - только хирагана → `hiragana`;
 * - только катакана → `katakana`;
 * - есть и то и другое → `mixed`;
 * - нет каны или есть кандзи/латиница/цифры → `null`.
 *
 * Знаки вроде «ー», «・» и пунктуация считаются нейтральными: они встречаются
 * в обеих письменностях и не должны превращать «らーめん» в смешанную карточку.
 */

function isHiragana(code: number): boolean {
  return (
    (code >= 0x3041 && code <= 0x3096) ||
    code === 0x309d ||
    code === 0x309e
  )
}

function isKatakana(code: number): boolean {
  return (
    (code >= 0x30a1 && code <= 0x30fa) ||
    code === 0x30fd ||
    code === 0x30fe ||
    // Полуширинная катакана.
    (code >= 0xff66 && code <= 0xff9d)
  )
}

function isNeutral(code: number): boolean {
  // Пробелы и управляющие символы.
  if (code <= 0x20 || (code >= 0x7f && code <= 0x9f)) return true
  // ゠, ・, ー — общие для двух письменностей знаки.
  if (code === 0x30a0 || code === 0x30fb || code === 0x30fc) return true
  // Общая пунктуация.
  if (code >= 0x2000 && code <= 0x206f) return true
  // CJK-пунктуация: 、。「」〜 и подобное.
  if (code >= 0x3000 && code <= 0x303f) return true
  // Вертикальные формы пунктуации.
  if (code >= 0xfe10 && code <= 0xfe19) return true
  if (code >= 0xfe30 && code <= 0xfe4f) return true
  // Полноширинные знаки пунктуации (без букв и цифр).
  if (code >= 0xff01 && code <= 0xff0f) return true
  if (code >= 0xff1a && code <= 0xff20) return true
  if (code >= 0xff3b && code <= 0xff40) return true
  if (code >= 0xff5b && code <= 0xff65) return true
  // ASCII-пунктуация.
  if (code >= 0x21 && code <= 0x2f) return true
  if (code >= 0x3a && code <= 0x40) return true
  if (code >= 0x5b && code <= 0x60) return true
  if (code >= 0x7b && code <= 0x7e) return true
  return false
}

export function detectKanaScript(text: string): KanaScript | null {
  let hasHiragana = false
  let hasKatakana = false

  for (const char of text) {
    const code = char.codePointAt(0)
    if (code === undefined) continue

    if (isHiragana(code)) {
      hasHiragana = true
      continue
    }
    if (isKatakana(code)) {
      hasKatakana = true
      continue
    }
    if (isNeutral(code)) continue

    // Кандзи, латиница, цифры и прочие значимые символы — это не чистая кана.
    return null
  }

  if (hasHiragana && hasKatakana) return 'mixed'
  if (hasHiragana) return 'hiragana'
  if (hasKatakana) return 'katakana'
  return null
}
