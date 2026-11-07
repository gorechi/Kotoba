/** Транскрипция японской кана в кириллицу по правилам из файла хирагана.txt */

const VOWELS = 'аеиоу'

/** Одиночные символы: ка → ка, ши → ши и т.д. */
const KANA_TO_CYRILLIC: Record<string, string> = {
  // гласные
  '\u3042': '\u0430', // あ → а
  '\u3044': '\u0438', // い → и
  '\u3046': '\u0443', // う → у
  '\u3048': '\u044D', // え → э
  '\u304A': '\u043E', // お → о
  // k-ряд
  '\u304B': '\u043a\u0430', // か → ка
  '\u304D': '\u043a\u0438', // き → ки
  '\u304F': '\u043a\u0443', // く → ку
  '\u3051': '\u043a\u044d', // け → кэ
  '\u3053': '\u043a\u043e', // こ → ко
  // s-ряд
  '\u3055': '\u0441\u0430', // さ → са
  '\u3057': '\u0448\u0438', // し → ши
  '\u3059': '\u0441\u0443', // す → су
  '\u305B': '\u0441\u044d', // せ → сэ
  '\u305D': '\u0441\u043e', // そ → со
  // t-ряд
  '\u305F': '\u0442\u0430', // た → та
  '\u3061': '\u0447\u0438', // ち → чи
  '\u3064': '\u0442\u0441\u0443', // つ → тсу
  '\u3066': '\u0442\u044d', // て → тэ
  '\u3068': '\u0442\u043e', // と → то
  // n-ряд
  '\u306A': '\u043d\u0430', // な → на
  '\u306B': '\u043d\u0438', // に → ни
  '\u306C': '\u043d\u0443', // ぬ → ну
  '\u306D': '\u043d\u044d', // ね → нэ
  '\u306E': '\u043d\u043e', // の → но
  // h-ряд
  '\u306F': '\u0445\u0430', // は → ха
  '\u3072': '\u0445\u0438', // ひ → хи
  '\u3075': '\u0444\u0443', // ふ → фу
  '\u3078': '\u0445\u044d', // へ → хэ
  '\u307B': '\u0445\u043e', // ホ → хо
  // m-ряд
  '\u307E': '\u043c\u0430', // ま → ма
  '\u307F': '\u043c\u0438', // み → ми
  '\u3080': '\u043c\u0443', // む → му
  '\u3081': '\u043c\u044d', // め → мэ
  '\u3082': '\u043c\u043e', // も → мо
  // y-ряд
  '\u3084': '\u044f', // や → я
  '\u3086': '\u044e', // ゆ → ю
  '\u3088': '\u0451', // よ → ё
  // r-ряд
  '\u3089': '\u0440\u0430', // ら → ра
  '\u308A': '\u0440\u0438', // り → ри
  '\u308B': '\u0440\u0443', // る → ру
  '\u308C': '\u0440\u044d', // れ → рэ
  '\u308D': '\u0440\u043e', // ろ → ро
  // w-ряд
  '\u308F': '\u0432\u0430', // わ → ва
  '\u3092': '\u0432\u043e', // を → во
  '\u3093': '\u043d', // ん → н
  // g-ряд
  '\u304C': '\u0433\u0430', // が → га
  '\u304E': '\u0433\u0438', // ぎ → ги
  '\u3050': '\u0433\u0443', // ぐ → гу
  '\u3052': '\u0433\u044d', // げ → гэ
  '\u3054': '\u0433\u043e', // ご → го
  // z-ряд
  '\u3056': '\u0437\u0430', // ざ → за
  '\u3058': '\u0434\u0436\u0438', // じ → джи
  '\u305A': '\u0437\u0443', // ず → зу
  '\u305C': '\u0437\u044d', // ぜ → зэ
  '\u305E': '\u0437\u043e', // ぞ → зо
  // d-ряд
  '\u3060': '\u0434\u0430', // だ → да
  '\u3062': '\u0434\u0438', // ぢ → ди
  '\u3065': '\u0434\u0443', // づ → ду
  '\u3067': '\u0434\u044d', // で → дэ
  '\u3069': '\u0434\u043e', // ど → до
  // b-ряд
  '\u3070': '\u0431\u0430', // ば → ба
  '\u3073': '\u0431\u0438', // び → би
  '\u3076': '\u0431\u0443', // ぶ → бу
  '\u3079': '\u0431\u044d', // べ → бэ
  '\u307C': '\u0431\u043e', // ぼ → бо
  // p-ряд
  '\u3071': '\u043f\u0430', // ぱ → па
  '\u3074': '\u043f\u0438', // ぴ → пи
  '\u3077': '\u043f\u0443', // ぷ → пу
  '\u307A': '\u043f\u044d', // ぺ → пэ
  '\u307D': '\u043f\u043e', // ぽ → по
}

/** Слоги с дополнительными символами (きゃ, шя и т.д.) */
const Y_COMBINATIONS: Record<string, string> = {
  '\u304D\u3083': '\u043a\u044f', // きゃ → кя
  '\u304D\u3085': '\u043a\u044e', // きゅ → кю
  '\u304D\u3087': '\u043a\u0451', // きょ → кё
  '\u3057\u3083': '\u0448\u044f', // しя → шя
  '\u3057\u3085': '\u0448\u044e', // しゅ → шю
  '\u3057\u3087': '\u0448\u0451', // しょ → шё
  '\u3061\u3083': '\u0447\u044f', //ちゃ → чя
  '\u3061\u3085': '\u0447\u044e', //ちゅ → чю
  '\u3061\u3087': '\u0447\u0451', //ちょ → чё
  '\u306B\u3083': '\u043d\u044f', //にゃ → ня
  '\u306B\u3085': '\u043d\u044e', //にゅ → ню
  '\u306B\u3087': '\u043d\u0451', //にょ → нё
  '\u3072\u3083': '\u0445\u044f', //ひゃ → хя
  '\u3072\u3085': '\u0445\u044e', //ひゅ → хю
  '\u3072\u3087': '\u0445\u0451', //ひょ → хё
  '\u307F\u3083': '\u043c\u044f', //みゃ → мя
  '\u307F\u3085': '\u043c\u044e', //みゅ → мю
  '\u307F\u3087': '\u043c\u0451', //みょ → мё
  '\u308A\u3083': '\u0440\u044f', //ря → ря
  '\u308A\u3085': '\u0440\u044e', //рю → рю
  '\u308A\u3087': '\u0440\u0451', //рё → рё
  '\u3052\u3083': '\u0433\u044f', //гя → гя
  '\u3052\u3085': '\u0433\u044e', //гю → гю
  '\u3052\u3087': '\u0433\u0451', //гё → гё
  '\u3058\u3083': '\u0434\u0436\u044f', //じゃ → джя
  '\u3058\u3085': '\u0434\u0436\u044e', //джю → джю
  '\u3058\u3087': '\u0434\u0436\u0451', //джё → джё
  '\u3073\u3083': '\u0431\u044f', //бя → бя
  '\u3073\u3085': '\u0431\u044e', //бю → бю
  '\u3073\u3087': '\u0431\u0451', //бё → бё
  '\u3074\u3083': '\u043f\u044f', //пя → пя
  '\u3074\u3085': '\u043f\u044e', //пю → пю
  '\u3074\u3087': '\u043f\u0451', //пё → пё
}

/** Малые гласные */
const SMALL_VOWELS: Record<string, string> = {
  '\u3041': '\u0430', // ぁ → а
  '\u3043': '\u0438', // ぃ → и
  '\u3045': '\u0443', // ぅ → у
  '\u3047': '\u044D', // ぇ → э
  '\u3049': '\u043E', // ぉ → о
}

/** Гласные кана (для правила удлиннения) */
const STANDALONE_VOWELS = new Set(['\u3042', '\u3044', '\u3046', '\u3048', '\u304A'])

/** Какая гласная буква в кириллице соответствует кана */
const KANA_VOWEL: Record<string, string> = {
  '\u3042': '\u0430', // あ → а
  '\u3044': '\u0438', // い → и
  '\u3046': '\u0443', // う → у
  '\u3048': '\u044D', // え → э
  '\u304A': '\u043E', // お → о
}

/** Начальная согласная кириллической транскрипции (для удвоения после っ) */
function getInitialConsonant(cyr: string): string | null {
  // Digraph 'дж'
  if (cyr.startsWith('\u0434\u0436')) return '\u0434\u0436'
  const first = cyr[0]
  if (first && !VOWELS.includes(first)) return first
  return null
}

/** Последняя гласная буква в конце кириллического слога */
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
    if (char === '\u3063') {
      tokens.push('\u3063')
      i++
      continue
    }

    // знак долгого гласного
    if (char === '\u30FC') {
      tokens.push('\u30FC')
      i++
      continue
    }

    // слог с дополнительным символом: консонант + малый я/ю/ё
    if (i + 1 < kana.length && '\u3083\u3085\u3087'.includes(kana[i + 1])) {
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
 * - повторная гласная после того же звука → : (すう → су:)
 * - ー продлевает предыдущую гласную (かー → ка:)
 */
export function toCyrillic(kana: string): string {
  if (!kana) return ''

  const tokens = tokenize(kana)
  const syllables: string[] = []
  let pendingDouble = false

  for (const token of tokens) {
    // マルチпликатор удвоения
    if (token === '\u3063') {
      pendingDouble = true
      continue
    }

    // знак долгого гласного
    if (token === '\u30FC') {
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
