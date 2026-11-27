import { toHiragana, toKatakana, toRomaji } from 'wanakana'
import { translate } from './i18n'

export type KanaMode = 'hiragana' | 'katakana'

export interface KanaModeOption {
  mode: KanaMode
  label: string
  title: string
}

/** Варианты ввода каны с подписями на текущем языке. */
export function kanaModes(): KanaModeOption[] {
  return [
    { mode: 'hiragana', label: 'あ', title: translate('kanaMode.hiragana') },
    { mode: 'katakana', label: 'ア', title: translate('kanaMode.katakana') },
  ]
}

const EXTRA_SIGNS: Record<KanaMode, string[]> = {
  hiragana: ['っ', 'ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゔ', 'ー'],
  katakana: ['ッ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ヴ', 'ー'],
}

/** Недавно набранный латинский хвост — его и превращаем в кану. */
const ROMAJI_TAIL = /[a-z'-]+$/i
const KANA_AFTER_APOSTROPHE = /'(?=[\u3040-\u30ff])/g

/** Апостроф — служебный разделитель, в готовом тексте его быть не должно. */
function cleanKanaApostrophes(value: string): string {
  return value.replace(KANA_AFTER_APOSTROPHE, '')
}

/** Латинские знаки препинания в японской раскладке. */
const JAPANESE_PUNCTUATION: Record<string, string> = {
  ',': '\u3001', // 、
  '.': '\u3002', // 。
  '?': '\uFF1F', // ？
  '!': '\uFF01', // ！
  ':': '\uFF1A', // ：
  ';': '\uFF1B', // ；
  '(': '\uFF08', // （
  ')': '\uFF09', // ）
  '[': '\uFF3B', // ［
  ']': '\uFF3D', // ］
  '{': '\uFF5B', // ｛
  '}': '\uFF5D', // ｝
  '~': '\u301C', // 〜
  '-': '\u30FC', // ー
  '/': '\u30FB', // ・
}

const LATIN_PUNCTUATION = /[,\.\?!:;\(\)\[\]\{\}~\/-]/g

/** Переводит знаки препинания по всей строке, не трогая апостроф-разделитель. */
export function toJapanesePunctuation(value: string): string {
  return value.replace(
    LATIN_PUNCTUATION,
    (char) => JAPANESE_PUNCTUATION[char] ?? char,
  )
}

/** Финальная обработка каны: убираем служебные апострофы и японизируем пунктуацию. */
function finalizeConverted(value: string): string {
  return toJapanesePunctuation(cleanKanaApostrophes(value))
}
/** После этих символов висящая «n» уже точно читается как ん. */
const SEPARATOR = /[\s、。，．！？!?.,:;：；()（）\[\]［］{}｛｝「」『』・〜…]/
const KANA_TEXT = /^[\u3000-\u303f\u3040-\u30ff\s\p{P}\p{S}]+$/u
const HAS_KANA = /[\u3040-\u309f\u30a0-\u30ff]/
const HIRAGANA_N = '\u3093'
const KATAKANA_N = '\u30f3'

/** Слоги ряда на: な, に, ぬ, ね, の. */
const N_ROW: Record<string, string> = {
  a: '\u306a',
  i: '\u306b',
  u: '\u306c',
  e: '\u306d',
  o: '\u306e',
}

/** Слоги にゃ, にゅ, にょ. */
const NY_ROW: Record<string, string> = {
  a: '\u306b\u3083',
  u: '\u306b\u3085',
  o: '\u306b\u3087',
}

export function extraSigns(mode: KanaMode): string[] {
  return EXTRA_SIGNS[mode]
}

/** Подбирает раскладку под уже введённый текст. */
export function guessKanaMode(text: string | undefined, fallback: KanaMode = 'hiragana'): KanaMode {
  if (!text) return fallback
  if (/[\u30a0-\u30ff]/.test(text) && !/[\u3040-\u309f]/.test(text)) return 'katakana'
  if (/[\u3040-\u309f]/.test(text)) return 'hiragana'
  return fallback
}

function kanaConverter(mode: KanaMode) {
  return mode === 'katakana' ? toKatakana : toHiragana
}

/**
 * wanakana в режиме IME теряет вторую «n» в «nn» (konnichiha → こんいちは).
 * Принудительный апостроф заставляет её прочитать «nn» как ん + следующий слог.
 */
function normalizeRomaji(text: string): string {
  return text.toLowerCase().replace(/nn/g, "n'n")
}

function convert(text: string, mode: KanaMode, live: boolean): string {
  const converter = kanaConverter(mode)
  return live ? converter(normalizeRomaji(text), { IMEMode: true }) : converter(normalizeRomaji(text))
}

function endsWithN(value: string): boolean {
  return value.endsWith(HIRAGANA_N) || value.endsWith(KATAKANA_N)
}

function nKana(map: Record<string, string>, vowel: string, mode: KanaMode) {
  const kana = map[vowel.toLowerCase()]
  if (!kana) return null
  return mode === 'katakana' ? toKatakana(kana) : kana
}

/**
 * Висящая «n» уже стала ん. Если сразу после неё вводят гласную,
 * ん — это начало слога: ん + a → な, ん + ya → にゃ.
 */
function mergeTrailingN(
  prefix: string,
  tail: string,
  mode: KanaMode,
): string | null {
  if (!endsWithN(prefix)) return null
  const lower = tail.toLowerCase()

  const nya = lower.match(/^y([auo])/)
  if (nya) {
    const kana = nKana(NY_ROW, nya[1], mode)
    if (!kana) return null
    const rest = tail.slice(2)
    return prefix.slice(0, -1) + kana + (rest ? convert(rest, mode, true) : '')
  }

  const vowel = lower.match(/^([aiueo])/)
  if (vowel) {
    const kana = nKana(N_ROW, vowel[1], mode)
    if (!kana) return null
    const rest = tail.slice(1)
    return prefix.slice(0, -1) + kana + (rest ? convert(rest, mode, true) : '')
  }

  return null
}

/** IME оставляет конечную «n» латиницей — сразу заменяем её на ん. */
function convertLiveTail(tail: string, mode: KanaMode): string {
  const converted = convert(tail, mode, true)
  if (/n$/i.test(tail) && /n$/i.test(converted)) {
    return converted.slice(0, -1) + (mode === 'katakana' ? KATAKANA_N : HIRAGANA_N)
  }
  return converted
}

/**
 * Превращает латинский хвост строки в кану, не трогая уже готовые знаки.
 * Конечная «n» сразу становится ん. Если после неё вводят гласную, ん
 * переосмысляется как начало слога: «kan» → かん, затем «a» → かな.
 */
export function convertRomajiTail(value: string, mode: KanaMode): string {
  if (!value) return value

  const tail = value.match(ROMAJI_TAIL)?.[0]
  if (tail) {
    const prefix = value.slice(0, value.length - tail.length)
    const merged = mergeTrailingN(prefix, tail, mode)
    if (merged !== null) return finalizeConverted(merged)

    // Вторая «n» после ん — это начало следующего слога (konn + i → こんに).
    if (endsWithN(prefix) && /^n$/i.test(tail)) return finalizeConverted(value)

    return finalizeConverted(prefix + convertLiveTail(tail, mode))
  }

  // Пробел или знак препинания фиксирует отложенную «n».
  const last = value.slice(-1)
  const before = value.slice(0, -1).match(ROMAJI_TAIL)?.[0]
  if (last && SEPARATOR.test(last) && before && /n$/i.test(before)) {
    const prefix = value.slice(0, value.length - last.length - before.length)
    if (endsWithN(prefix) && /^n$/i.test(before)) return finalizeConverted(prefix + last)
    return finalizeConverted(prefix + convert(before, mode, false) + last)
  }

  return finalizeConverted(value)
}

/** Полное превращение хвоста — при уходе из поля, Tab и сохранении. */
export function finalizeRomajiTail(value: string, mode: KanaMode): string {
  if (!value) return value
  const withoutApostrophes = value.replace(/'/g, '')
  const tail = withoutApostrophes.match(ROMAJI_TAIL)?.[0]
  if (!tail) return finalizeConverted(withoutApostrophes)
  const prefix = withoutApostrophes.slice(0, withoutApostrophes.length - tail.length)
  // Отложенная вторая «n» после ん уже ничего не добавляет: konn → こん.
  if (endsWithN(prefix) && /^n$/i.test(tail)) return finalizeConverted(prefix)
  return finalizeConverted(prefix + convert(tail, mode, false))
}

/** Аккуратно переводит уже введённый текст в выбранный режим. */
export function convertForModeSwitch(value: string, from: KanaMode, to: KanaMode): string {
  if (from === to || !value) return value
  const converter = to === 'katakana' ? toKatakana : toHiragana
  return finalizeConverted(
    converter(value, { passRomaji: true, convertLongVowelMark: false }),
  )
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
