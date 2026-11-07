/** Транскрипция японской кана в кириллицу по правилам из файла хирагана.txt */

const VOWELS = 'аеиоу'

/** Одиночные символы: ка → ка, ши → ши и т.д. */
const KANA_TO_CYRILLIC: Record<string, string> = {
  // гласные
  'あ': 'а', 'い': 'и', 'у': 'у', 'е': 'э', 'о': 'о',
  // k-ряд
  'か': 'ка', 'き': 'ки', 'く': 'ку', 'け': 'кэ', 'こ': 'ко',
  // s-ряд
  'さ': 'са', 'し': 'ши', 'す': 'су', 'せ': 'сэ', 'そ': 'со',
  // t-ряд
  'た': 'та', 'ち': 'чи', 'つ': 'тсу', 'て': 'тэ', 'と': 'то',
  // n-ряд
  'な': 'на', 'に': 'ни', 'ぬ': 'ну', 'ね': 'нэ', 'の': 'но',
  // h-ряд
  'は': 'ха', 'ひ': 'хи', 'ふ': 'фу', 'へ': 'хэ', 'ほ': 'хо',
  // m-ряд
  'ま': 'ма', 'み': 'ми', 'му': 'му', 'め': 'мэ', 'も': 'мо',
  // y-ряд
  'や': 'я', 'ゆ': 'ю', 'よ': 'ё',
  // r-ряд
  'ら': 'ра', 'り': 'ри', 'る': 'ру', 'れ': 'рэ', 'ろ': 'ро',
  // w-ряд
  'わ': 'ва', 'を': 'во', 'н': 'н',
  // g-ряд
  'が': 'га', 'ぎ': 'ги', 'ぐ': 'гу', 'げ': 'гэ', 'ご': 'го',
  // z-ряд
  'ざ': 'за', 'じ': 'джи', 'ず': 'зу', 'ぜ': 'зэ', 'ぞ': 'зо',
  // d-ряд
  'да': 'да', 'ぢ': 'ди', 'づ': 'ду', 'で': 'дэ', 'ど': 'до',
  // b-ряд
  'ば': 'ба', 'び': 'би', 'ぶ': 'бу', 'べ': 'бэ', 'ぼ': 'бо',
  // p-ряд
  'ぱ': 'па', 'ぴ': 'пи', 'ぷ': 'пу', 'ぺ': 'пэ', 'ぽ': 'по',
}

/** Слоги с дополнительными символами (きゃ, шя и т.д.) */
const Y_COMBINATIONS: Record<string, string> = {
  'きゃ': 'кя', 'きゅ': 'кю', 'きょ': 'кё',
  'しゃ': 'шя', 'しゅ': 'шю', 'しょ': 'шё',
  'ちゃ': 'чя', 'ちゅ': 'чю', 'ちょ': 'чё',
  'ня': 'ня', 'ню': 'ню', 'нё': 'нё',
  'хя': 'хя', 'хю': 'хю', 'хё': 'хё',
  'мя': 'мя', 'мю': 'мю', 'мё': 'мё',
  'ря': 'ря', 'рю': 'рю', 'рё': 'рё',
  'гя': 'гя', 'гю': 'гю', 'гё': 'гё',
  'じゃ': 'джя', 'джю': 'джю', 'джё': 'джё',
  'бя': 'бя', 'бю': 'бю', 'бё': 'бё',
  'пя': 'пя', 'пю': 'пю', 'пё': 'пё',
}

/** Малые гласные */
const SMALL_VOWELS: Record<string, string> = {
  'ぁ': 'а', 'ぃ': 'и', 'ぅ': 'у', 'ぇ': 'э', 'ぉ': 'о',
}

/** Гласные кана (для правила удлиннения) */
const STANDALONE_VOWELS = new Set(['あ', 'い', 'у', 'е', 'о'])

/** Какая гласная буква в кириллице соответствует кана */
const KANA_VOWEL: Record<string, string> = {
  'あ': 'а', 'い': 'и', 'у': 'у', 'е': 'э', 'о': 'о',
}

/** Начальная согласная цирллической транскрипции (для удвоения после っ) */
function getInitialConsonant(cyr: string): string | null {
  // Digraph 'дж'
  if (cyr.startsWith('дж')) return 'дж'
  const first = cyr[0]
  if (first && !VOWELS.includes(first)) return first
  return null
}

/** Последняя гласная буквы в конце cyrillic слога */
function getLastVowel(cyr: string): string | null {
  for (let i = cyr.length - 1; i >= 0; i--) {
    if (VOWELS.includes(cyr[i])) return cyr[i]
  }
  return null
}

/** Удлиннение гласной: добавить ':' к последней гласной слога */
function extendVowel(cyr: string): string {
  for (let i = cyr.length - 1; i >= 0; i--) {
    if (VOWELS.includes(cyr[i])) {
      return cyr.slice(0, i) + cyr[i] + ':' + cyr.slice(i + 1)
    }
  }
  return cyr
}

/** Разбить kana-строку на токены (слоги и маркеры) */
function tokenize(kana: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < kana.length) {
    const char = kana[i]

    // малый つ — маркер удвоения
    if (char === 'っ') {
      tokens.push('っ')
      i++
      continue
    }

    // знак долгого гласного
    if (char === 'ー') {
      tokens.push('ー')
      i++
      continue
    }

    // слог с дополнительным символом: консонант + малый я/ю/ё
    if (i + 1 < kana.length && 'ゃゅょ'.includes(kana[i + 1])) {
      const combo = kana[i] + kana[i + 1]
      if (combo in Y_COMBINATIONS) {
        tokens.push(combo)
        i += 2
        continue
      }
    }

    // малая гласная
    if (char in SMALL_VOWELS) {
      tokens.push(char)
      i++
      continue
    }

    // обычный символ
    tokens.push(char)
    i++
  }
  return tokens
}

/**
 * Транскрибировать japanese kana в кириллицу.
 * Правила:
 * - слоги через дефис, нижний регистр
 * - っ удваивает начальную согласную следующего слога (っか → к-ка)
 * - повторная гласная после того же звука → : (すу → су:)
 * - ー продлевает предыдущую гласную (かー → ка:)
 */
export function toCyrillic(kana: string): string {
  if (!kana) return ''

  const tokens = tokenize(kana)
  const syllables: string[] = []
  let pendingDouble = false

  for (const token of tokens) {
    // マルチпликатор удвоения
    if (token === 'っ') {
      pendingDouble = true
      continue
    }

    // знак долгого гласного
    if (token === 'ー') {
      if (syllables.length > 0) {
        const last = syllables.pop()
        if (last) syllables.push(extendVowel(last))
      }
      continue
    }

    // ищем транскрипцию
    let cyr =
      KANA_TO_CYRILLIC[token] ??
      Y_COMBINATIONS[token] ??
      SMALL_VOWELS[token] ??
      token

    // правило удлиннения гласной: standalone vowel kana после той же гласной
    if (STANDALONE_VOWELS.has(token) && syllables.length > 0) {
      const last = syllables[syllables.length - 1]
      const lastVowel = getLastVowel(last)
      const currentVowel = KANA_VOWEL[token]
      if (lastVowel && currentVowel && lastVowel === currentVowel) {
        syllables[syllables.length - 1] = last + ':'
        continue
      }
    }

    // правило удвоения согласной после っ
    if (pendingDouble) {
      const initial = getInitialConsonant(cyr)
      if (initial) {
        cyr = initial + '-' + cyr
      }
      pendingDouble = false
    }

    syllables.push(cyr)
  }

  return syllables.join('-')
}
