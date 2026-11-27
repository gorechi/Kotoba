import { toKatakana, toRomaji } from 'wanakana'
import {
  convertRomajiTail,
  finalizeRomajiTail,
  type KanaMode,
} from './romaji'

/**
 * Общепринятая русская запись японских слогов.
 * Основа — си, ти, цу, дзи, дзя, а не варианты из кириллической транскрипции.
 */
const SYLLABLES: Record<string, string> = {
  // гласные
  а: 'あ',
  и: 'い',
  у: 'う',
  э: 'え',
  е: 'え',
  о: 'お',
  я: 'や',
  ю: 'ゆ',
  ё: 'よ',
  й: 'い',
  // к
  ка: 'か',
  ки: 'き',
  ку: 'く',
  кэ: 'け',
  ке: 'け',
  ко: 'こ',
  // с
  са: 'さ',
  си: 'し',
  ши: 'し',
  су: 'す',
  сэ: 'せ',
  се: 'せ',
  со: 'そ',
  // т
  та: 'た',
  ти: 'ち',
  чи: 'ち',
  цу: 'つ',
  тэ: 'て',
  те: 'て',
  то: 'と',
  // н
  на: 'な',
  ни: 'に',
  ну: 'ぬ',
  нэ: 'ね',
  не: 'ね',
  но: 'の',
  // х
  ха: 'は',
  хи: 'ひ',
  фу: 'ふ',
  хэ: 'へ',
  хе: 'へ',
  хо: 'ほ',
  // м
  ма: 'ま',
  ми: 'み',
  му: 'む',
  мэ: 'め',
  ме: 'め',
  мо: 'も',
  // р
  ра: 'ら',
  ри: 'り',
  ру: 'る',
  рэ: 'れ',
  ре: 'れ',
  ро: 'ろ',
  // в
  ва: 'わ',
  во: 'を',
  ву: 'ゔ',
  // г
  га: 'が',
  ги: 'ぎ',
  гу: 'ぐ',
  гэ: 'げ',
  ге: 'げ',
  го: 'ご',
  // з / дз
  дза: 'ざ',
  дзи: 'じ',
  дзу: 'ず',
  дзэ: 'ぜ',
  дзе: 'ぜ',
  дзо: 'ぞ',
  за: 'ざ',
  зи: 'じ',
  зу: 'ず',
  зэ: 'ぜ',
  зе: 'ぜ',
  зо: 'ぞ',
  // д
  да: 'だ',
  дэ: 'で',
  де: 'で',
  до: 'ど',
  // б
  ба: 'ば',
  би: 'び',
  бу: 'ぶ',
  бэ: 'べ',
  бе: 'べ',
  бо: 'ぼ',
  // п
  па: 'ぱ',
  пи: 'ぴ',
  пу: 'ぷ',
  пэ: 'ぺ',
  пе: 'ぺ',
  по: 'ぽ',
  // ёон
  кя: 'きゃ',
  кю: 'きゅ',
  кё: 'きょ',
  ся: 'しゃ',
  сю: 'しゅ',
  сё: 'しょ',
  тя: 'ちゃ',
  тю: 'ちゅ',
  тё: 'ちょ',
  ня: 'にゃ',
  ню: 'にゅ',
  нё: 'にょ',
  хя: 'ひゃ',
  хю: 'ひゅ',
  хё: 'ひょ',
  мя: 'みゃ',
  мю: 'みゅ',
  мё: 'みょ',
  ря: 'りゃ',
  рю: 'りゅ',
  рё: 'りょ',
  гя: 'ぎゃ',
  гю: 'ぎゅ',
  гё: 'ぎょ',
  дзя: 'じゃ',
  дзю: 'じゅ',
  дзё: 'じょ',
  зя: 'じゃ',
  зю: 'じゅ',
  зё: 'じょ',
  бя: 'びゃ',
  бю: 'びゅ',
  бё: 'びょ',
  пя: 'ぴゃ',
  пю: 'ぴゅ',
  пё: 'ぴょ',
  // заимствования с малыми гласными
  фа: 'ふぁ',
  фи: 'ふぃ',
  фэ: 'ふぇ',
  фе: 'ふぇ',
  фо: 'ふぉ',
  ше: 'しぇ',
  же: 'じぇ',
  че: 'ちぇ',
}

/** Ди/ду зависят от режима: в хирагане ぢ/づ, в катакане ディ/ドゥ. */
const MODE_SYLLABLES: Record<string, Record<KanaMode, string>> = {
  ди: { hiragana: 'ぢ', katakana: 'でぃ' },
  ду: { hiragana: 'づ', katakana: 'どぅ' },
}

const VOWEL_SOUND: Record<string, string> = {
  а: 'a',
  и: 'i',
  у: 'u',
  э: 'e',
  е: 'e',
  о: 'o',
  я: 'a',
  ю: 'u',
  ё: 'o',
  й: 'i',
}

const VOWELS = new Set(Object.keys(VOWEL_SOUND))
const SEPARATORS = new Set(['ъ', 'ь', "'", '-'])
const DOUBLING_CONSONANTS = new Set('бвгджзклмпрстфхцчшщ'.split(''))
const CYRILLIC_RUN = /[ъь'\-:]*[а-яё][а-яёъь'\-:]*|[ъь'\-:]+/gi

/** Если после ん сразу вводят гласную, ん переосмысляется как начало слога. */
const N_MERGE: Record<string, string> = {
  а: 'な',
  и: 'に',
  у: 'ぬ',
  э: 'ね',
  е: 'ね',
  о: 'の',
  я: 'にゃ',
  ю: 'にゅ',
  ё: 'にょ',
}

interface ConvertedRun {
  text: string
  mergePreviousN: boolean
}

function kanaFor(key: string, mode: KanaMode): string | undefined {
  const special = MODE_SYLLABLES[key]
  if (special) return special[mode]
  return SYLLABLES[key]
}

function syllableVowel(key: string): string | null {
  const last = key.slice(-1)
  return VOWEL_SOUND[last] ?? null
}

/** Гласная последней каны перед кириллическим хвостом — для долгого повтора. */
function lastKanaVowel(text: string): string | null {
  const last = text.slice(-1)
  if (!/[\u3040-\u309f\u30a0-\u30ff]/.test(last) || last === '\u30FC') return null
  const romaji = toRomaji(text.slice(-2))
  const vowels = romaji.match(/[aeiou]/g)
  return vowels?.length ? vowels[vowels.length - 1] : null
}

function convertRun(
  run: string,
  mode: KanaMode,
  before: string,
  atEnd: boolean,
): ConvertedRun {
  const text = run.toLowerCase()
  let out = ''
  let lastVowel = lastKanaVowel(before)
  let mergePreviousN = false
  let index = 0

  // Разделитель после ん оставляем видимым до следующего ввода:
  // он не даёт переосмыслить ん как な/に/… при вводе гласной.
  if (atEnd && /^[ъь'\-]+$/.test(text)) {
    return { text: run, mergePreviousN: false }
  }

  // ん + гласная без разделителя = слог ряда な.
  if (
    (before.endsWith('ん') || before.endsWith('ン')) &&
    text[0] &&
    !SEPARATORS.has(text[0]) &&
    VOWELS.has(text[0])
  ) {
    const merged = N_MERGE[text[0]]
    if (merged) {
      mergePreviousN = true
      out += merged
      lastVowel = VOWEL_SOUND[text[0]] ?? null
      index = 1
    }
  }

  while (index < text.length) {
    const char = text[index]

    if (SEPARATORS.has(char)) {
      index += 1
      continue
    }

    if (char === ':') {
      out += '\u30FC'
      lastVowel = null
      index += 1
      continue
    }

    if (char === 'н') {
      const next = text[index + 1]
      if (next && SEPARATORS.has(next)) {
        out += 'ん'
        lastVowel = null
        index += 2
        continue
      }
      if (next && VOWELS.has(next)) {
        const kana = kanaFor(text.slice(index, index + 2), mode)
        if (kana) {
          out += kana
          lastVowel = syllableVowel(text.slice(index, index + 2))
          index += 2
          continue
        }
        out += 'ん'
        lastVowel = null
        index += 1
        continue
      }
      out += 'ん'
      lastVowel = null
      index += 1
      continue
    }

    if (VOWELS.has(char)) {
      const sound = VOWEL_SOUND[char]
      if (sound && lastVowel === sound) {
        out += '\u30FC'
        lastVowel = null
        index += 1
        continue
      }
      const kana = SYLLABLES[char]
      if (!kana) return { text: out + run.slice(index), mergePreviousN }
      out += kana
      lastVowel = sound ?? null
      index += 1
      continue
    }

    if (DOUBLING_CONSONANTS.has(char) && text[index + 1] === char) {
      const after = text[index + 2]
      if (after && VOWELS.has(after)) {
        out += 'っ'
        lastVowel = null
        index += 1
        continue
      }
    }

    const three = text.slice(index, index + 3)
    const kana3 = three.length === 3 ? kanaFor(three, mode) : undefined
    if (kana3) {
      out += kana3
      lastVowel = syllableVowel(three)
      index += 3
      continue
    }

    const two = text.slice(index, index + 2)
    const kana2 = two.length === 2 ? kanaFor(two, mode) : undefined
    if (kana2) {
      out += kana2
      lastVowel = syllableVowel(two)
      index += 2
      continue
    }

    // Незавершённый слог оставляем кириллицей до следующего ввода.
    return { text: out + run.slice(index), mergePreviousN }
  }

  return { text: out, mergePreviousN }
}

function processCyrillic(value: string, mode: KanaMode, finalize: boolean): string {
  if (!value) return value
  let result = ''
  let lastIndex = 0

  for (const match of value.matchAll(CYRILLIC_RUN)) {
    const index = match.index ?? 0
    const run = match[0]
    result += value.slice(lastIndex, index)
    const atEnd = !finalize && index + run.length === value.length
    const converted = convertRun(run, mode, result, atEnd)
    if (converted.mergePreviousN) result = result.slice(0, -1)
    const text = mode === 'katakana' ? toKatakana(converted.text) : converted.text
    result += text
    lastIndex = index + run.length
  }

  result += value.slice(lastIndex)
  return result
}

/** Превращает кириллицу в кану, не трогая уже готовые знаки. */
export function convertCyrillicInput(value: string, mode: KanaMode): string {
  return processCyrillic(value, mode, false)
}

/** Дочищает незавершённые хвосты кириллицы — при уходе из поля и сохранении. */
function finalizeCyrillicInput(value: string, mode: KanaMode): string {
  return processCyrillic(value, mode, true)
}

/** Общий ввод в режиме каны: кириллица, латиница и пунктуация. */
export function convertKanaInput(value: string, mode: KanaMode): string {
  if (!value) return value
  return convertRomajiTail(convertCyrillicInput(value, mode), mode)
}

/** Общая финализация ввода в режиме каны. */
export function finalizeKanaInput(value: string, mode: KanaMode): string {
  if (!value) return value
  return finalizeRomajiTail(finalizeCyrillicInput(value, mode), mode)
}
