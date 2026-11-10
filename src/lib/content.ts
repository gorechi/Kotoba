/**
 * Локализованный контент встроенных колод и карточек.
 *
 * Данные в хранилище не зависят от языка: названия встроенных колод,
 * переводы примеров каны и заметки берутся из файлов локалей при отображении.
 */
import type { Card, CardExample, Deck } from '../types'
import type { Translate } from './i18n'
import { N4_KANJI_DECK_ID, N5_KANJI_DECK_ID } from '../data/kanji-ids'
import {
  HIRAGANA_BASIC,
  HIRAGANA_VOICED,
  KATAKANA_BASIC,
  KATAKANA_VOICED,
  type KanaSeed,
} from '../data/kana'

const KANA_BY_SYMBOL = new Map<string, KanaSeed>()
for (const group of [HIRAGANA_BASIC, HIRAGANA_VOICED, KATAKANA_BASIC, KATAKANA_VOICED]) {
  for (const seed of group) KANA_BY_SYMBOL.set(seed.kana, seed)
}

/** Защищены от редактирования только встроенные азбуки. */
export function isProtectedDeck(deck: Deck): boolean {
  return deck.builtin && deck.kind === 'kana'
}

function builtinKanjiKey(card: Card): { pack: 'n5' | 'n4'; number: string } | null {
  for (const [pack, deckId] of [
    ['n5', N5_KANJI_DECK_ID],
    ['n4', N4_KANJI_DECK_ID],
  ] as const) {
    const prefix = `${deckId}-`
    if (!card.id.startsWith(prefix)) continue
    const number = card.id.slice(prefix.length)
    if (/^\d{3}$/.test(number)) return { pack, number }
  }
  return null
}

/**
 * Значение кандзи: пользовательский текст имеет приоритет,
 * иначе берётся локализованный текст встроенной колоды N5 или N4.
 */
export function cardMeaning(card: Card, t: Translate): string {
  if (card.meaning.trim()) return card.meaning
  const key = builtinKanjiKey(card)
  if (!key) return ''
  const message = `kanji.${key.pack}.${key.number}.meaning`
  const localized = t(message)
  return localized === message ? '' : localized
}

/** Перевод примера: пользовательский текст или локализованный N5/N4. */
export function cardExampleTranslation(
  card: Card,
  example: CardExample,
  t: Translate,
): string {
  if (example.translation.trim()) return example.translation
  const key = builtinKanjiKey(card)
  if (!key) return ''
  const exampleNumber = example.id.match(/^example-\d{3}-(\d+)$/)?.[1]
  if (!exampleNumber) return ''
  const message = `kanji.${key.pack}.${key.number}.example.${exampleNumber}`
  const localized = t(message)
  return localized === message ? '' : localized
}

/** Название колоды: своё имя имеет приоритет, затем локализованное имя встроенной. */
export function deckTitle(deck: Deck | undefined, t: Translate): string {
  if (!deck) return t('session.deckFallback')
  const custom = deck.name.trim()
  if (custom) return custom
  if (deck.builtin) {
    const key = `deck.${deck.id}.name`
    const localized = t(key)
    if (localized !== key) return localized
  }
  return t('common.untitled')
}

/** Описание колоды: своё описание имеет приоритет, затем локализованное. */
export function deckDescription(deck: Deck, t: Translate): string {
  if (deck.description.trim()) return deck.description
  if (deck.builtin) {
    const key = `deck.${deck.id}.description`
    const localized = t(key)
    if (localized !== key) return localized
  }
  return ''
}

/** Перевод примера или заметка для знака каны из локали. */
export function kanaNote(kana: string, t: Translate): string {
  const noteKey = `kana.note.${kana}`
  const note = t(noteKey)
  if (note !== noteKey) return note

  const seed = KANA_BY_SYMBOL.get(kana)
  if (!seed?.example) return ''
  const wordKey = `kana.word.${kana}`
  const word = t(wordKey)
  if (word === wordKey) return ''
  return `${seed.example} — ${word}`
}

/**
 * Заметка карточки: у встроенных азбук она собирается из локали,
 * у пользовательских карточек показывается сохранённый текст.
 */
export function cardNote(card: Card, deck: Deck | undefined, t: Translate): string {
  if (deck?.builtin && deck.kind === 'kana') {
    return kanaNote(card.front, t)
  }
  return card.note
}
