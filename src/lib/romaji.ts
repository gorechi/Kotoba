import { toHiragana, toKatakana, toRomaji } from 'wanakana'

export type KanaMode = 'abc' | 'hiragana' | 'katakana'

export interface KanaModeOption {
  mode: KanaMode
  label: string
  title: string
}

export const KANA_MODES: KanaModeOption[] = [
  { mode: 'abc', label: 'abc', title: 'Латиница (ромадзи)' },
  { mode: 'hiragana', label: 'あ', title: 'Хирагана' },
  { mode: 'katakana', label: 'ア', title: 'Катакана' },
]

const EXTRA_SIGNS: Record<Exclude<KanaMode, 'abc'>, string[]> = {
  hiragana: ['っ', 'ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゔ', 'ー'],
  katakana: ['ッ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ヴ', 'ー'],
}

/** Недавно набранный латинский хвост — его и превращаем в кану. */
const ROMAJI_TAIL = /[a-z'-]+$/i
/** После этих символов висящая «n» уже точно читается как ん. */
const SEPARATOR = /[\s、。！？!?.,:;()[\]{}「」『』・]/
const KANA_TEXT = /^[\u3000-\u303f\u3040-\u30ff\s]+$/
const HAS_KANA = /[\u3040-\u309f\u30a0-\u30ff]/

export function extraSigns(mode: KanaMode): string[] {
  return mode === 'abc' ? [] : EXTRA_SIGNS[mode]
}

/** Подбирает раскладку под уже введённый текст. */
export function guessKanaMode(text: string | undefined, fallback: KanaMode = 'hiragana'): KanaMode {
  if (!text) return fallback
  if (/[\u30a0-\u30ff]/.test(text) && !/[\u3040-\u309f]/.test(text)) return 'katakana'
  if (/[\u3040-\u309f]/.test(text)) return 'hiragana'
  return fallback
}

function kanaConverter(mode: Exclude<KanaMode, 'abc'>) {
  return mode === 'katakana' ? toKatakana : toHiragana
}

/**
 * wanakana в режиме IME теряет вторую «n» в «nn» (konnichiha → こんいちは).
 * Принудительный апостроф заставляет её прочитать «nn» как ん + следующий слог.
 */
function normalizeRomaji(text: string): string {
  return text.toLowerCase().replace(/nn/g, "n'n")
}

function convert(text: string, mode: Exclude<KanaMode, 'abc'>, live: boolean): string {
  const converter = kanaConverter(mode)
  return live ? converter(normalizeRomaji(text), { IMEMode: true }) : converter(normalizeRomaji(text))
}

/**
 * Превращает латинский хвост строки в кану, не трогая уже готовые знаки.
 * Висящая «n» остаётся латиницей до следующей буквы, пробела или ухода из поля,
 * чтобы «kan» + «a» давало かな, а не かんあ.
 */
export function convertRomajiTail(value: string, mode: KanaMode): string {
  if (mode === 'abc' || !value) return value

  const tail = value.match(ROMAJI_TAIL)?.[0]
  if (tail) {
    return value.slice(0, value.length - tail.length) + convert(tail, mode, true)
  }

  // Пробел или знак препинания после «n» фиксирует ん.
  const last = value.slice(-1)
  const before = value.slice(0, -1).match(ROMAJI_TAIL)?.[0]
  if (last && SEPARATOR.test(last) && before && /n$/i.test(before)) {
    return (
      value.slice(0, value.length - last.length - before.length) +
      convert(before, mode, false) +
      last
    )
  }

  return value
}

/** Полное превращение хвоста — при уходе из поля, Tab и сохранении. */
export function finalizeRomajiTail(value: string, mode: KanaMode): string {
  if (mode === 'abc' || !value) return value
  const tail = value.match(ROMAJI_TAIL)?.[0]
  if (!tail) return value
  return value.slice(0, value.length - tail.length) + convert(tail, mode, false)
}

/** Превращает всю латиницу в кане — при переключении abc → あ/ア. */
export function convertRomajiText(value: string, mode: KanaMode): string {
  if (mode === 'abc' || !value) return value
  return convert(value, mode, false)
}

/** Аккуратно переводит уже введённый текст в выбранный режим. */
export function convertForModeSwitch(value: string, from: KanaMode, to: KanaMode): string {
  if (from === to || !value) return value
  if (to === 'abc') return finalizeRomajiTail(value, from)
  if (from === 'abc') return convertRomajiText(value, to)
  const converter = to === 'katakana' ? toKatakana : toHiragana
  return converter(value, { passRomaji: true, convertLongVowelMark: false })
}

/**
 * Черновик чтения по кане: みず → mizu, かn → kan.
 * Если в поле есть кандзи или другой не-кана текст, подсказка пустая.
 */
export function suggestReading(value: string): string {
  if (!value) return ''
  const tail = value.match(ROMAJI_TAIL)?.[0] ?? ''
  const kanaPart = tail ? value.slice(0, -tail.length) : value
  if (!HAS_KANA.test(kanaPart) || !KANA_TEXT.test(kanaPart)) return ''
  return (toRomaji(kanaPart) + tail).toLowerCase()
}
