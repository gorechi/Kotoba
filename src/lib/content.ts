/**
 * Локализованный контент встроенных колод и карточек.
 *
 * Данные в хранилище не зависят от языка: названия встроенных колод,
 * переводы примеров каны и заметки берутся из файлов локалей при отображении.
 */
import type { Card, Deck } from '../types'
import type { Translate } from './i18n'
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

/** Название встроенной колоды из локали; для своих колод — сохранённое имя. */
export function deckTitle(deck: Deck | undefined, t: Translate): string {
  if (!deck) return t('session.deckFallback')
  if (deck.builtin) {
    const key = `deck.${deck.id}.name`
    const localized = t(key)
    if (localized !== key) return localized
  }
  return deck.name.trim() || t('common.untitled')
}

/** Описание встроенной колоды из локали; для своих колод — сохранённое описание. */
export function deckDescription(deck: Deck, t: Translate): string {
  if (deck.builtin) {
    const key = `deck.${deck.id}.description`
    const localized = t(key)
    if (localized !== key) return localized
  }
  return deck.description
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
