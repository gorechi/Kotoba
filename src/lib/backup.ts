import type { AppData, Card, Deck } from '../types'
import { normalizeData, normalizeImported } from './normalize'
import { uid } from './utils'

export type BackupImportMode = 'replace' | 'merge'

export type BackupInspectionError =
  | 'not-object'
  | 'unsupported-version'
  | 'missing-decks'
  | 'missing-cards'
  | 'no-valid-decks'

export interface BackupInspection {
  ok: boolean
  error?: BackupInspectionError
  /** Валидные колоды и карточки, которые попадут в приложение. */
  decks: number
  cards: number
  /** Записи, которые не прошли проверку или ссылаются на неизвестную колоду. */
  skippedDecks: number
  skippedCards: number
  builtinDecks: number
  customDecks: number
}

const EMPTY_INSPECTION = {
  decks: 0,
  cards: 0,
  skippedDecks: 0,
  skippedCards: 0,
  builtinDecks: 0,
  customDecks: 0,
} as const

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Проверяет, что файл действительно похож на резервную копию Котобы.
 * Не использует normalizeData: тот всегда добавляет встроенные колоды,
 * из-за чего любой JSON выглядел бы валидным.
 */
export function inspectBackup(raw: unknown): BackupInspection {
  if (!isObj(raw)) {
    return { ok: false, error: 'not-object', ...EMPTY_INSPECTION }
  }

  // Поддерживаем текущие копии (version 2) и старые/легаси-файлы без версии.
  if (raw.version !== undefined && raw.version !== 1 && raw.version !== 2) {
    return { ok: false, error: 'unsupported-version', ...EMPTY_INSPECTION }
  }

  if (!Array.isArray(raw.decks)) {
    return { ok: false, error: 'missing-decks', ...EMPTY_INSPECTION }
  }
  if (!Array.isArray(raw.cards)) {
    return { ok: false, error: 'missing-cards', ...EMPTY_INSPECTION }
  }

  const imported = normalizeImported(raw)
  if (imported.decks.length === 0) {
    return { ok: false, error: 'no-valid-decks', ...EMPTY_INSPECTION }
  }

  const customDecks = imported.decks.filter((deck) => !deck.builtin).length

  return {
    ok: true,
    decks: imported.decks.length,
    cards: imported.cards.length,
    skippedDecks: raw.decks.length - imported.decks.length,
    skippedCards: raw.cards.length - imported.cards.length,
    builtinDecks: imported.decks.length - customDecks,
    customDecks,
  }
}

/**
 * Добавляет в текущие данные только пользовательские колоды из копии.
 * Встроенные колоды не дублируются, настройки и история остаются текущими.
 */
function mergeImported(current: AppData, raw: unknown): AppData {
  const imported = normalizeImported(raw)
  const deckIds = new Set(current.decks.map((deck) => deck.id))
  const cardIds = new Set(current.cards.map((card) => card.id))
  const deckIdMap = new Map<string, string>()
  const newDecks: Deck[] = []
  const newCards: Card[] = []

  for (const deck of imported.decks) {
    if (deck.builtin) continue
    let id = deck.id
    if (deckIds.has(id)) id = uid('deck')
    deckIds.add(id)
    deckIdMap.set(deck.id, id)
    newDecks.push({ ...deck, id, builtin: false })
  }

  for (const card of imported.cards) {
    const deckId = deckIdMap.get(card.deckId)
    if (!deckId) continue
    let id = card.id
    if (cardIds.has(id)) id = uid('card')
    cardIds.add(id)
    newCards.push({ ...card, id, deckId })
  }

  return {
    ...current,
    decks: [...current.decks, ...newDecks],
    cards: [...current.cards, ...newCards],
  }
}

/** Возвращает новые данные приложения для выбранного режима импорта. */
export function applyBackup(
  current: AppData,
  raw: unknown,
  mode: BackupImportMode,
): AppData {
  return mode === 'merge' ? mergeImported(current, raw) : normalizeData(raw)
}
