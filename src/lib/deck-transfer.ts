/**
 * Перенос одной колоды между установками Kotoba.
 * Формат намеренно не включает SRS-прогресс: колода предназначена для обмена,
 * а полная резервная копия остаётся способом перенести прогресс.
 */
import type { AppData, Card, Deck } from '../types'
import { normalizeImported } from './normalize'
import { freshSrs } from './srs'
import { uid } from './utils'

export interface DeckTransferFile {
  format: 'kotoba-deck'
  version: 1
  deck: Deck
  cards: Omit<Card, 'srs'>[]
}

export interface ParsedDeckTransfer {
  deck: Deck
  cards: Card[]
}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Сериализует колоду без прогресса и сбрасывает признак встроенной колоды. */
export function createDeckTransfer(
  deck: Deck,
  cards: Card[],
  nameOverride?: string,
): DeckTransferFile {
  const name = (nameOverride ?? deck.name).trim() || deck.name
  return {
    format: 'kotoba-deck',
    version: 1,
    deck: { ...deck, name, builtin: false },
    cards: cards.map((card) => {
      const { srs: _srs, ...content } = card
      return content
    }),
  }
}

/**
 * Читает формат отдельной колоды. Для удобства принимает и полную копию,
 * если в ней ровно одна колода.
 */
export function parseDeckTransfer(raw: unknown): ParsedDeckTransfer | null {
  if (!isObj(raw)) return null

  let deck: unknown
  let cards: unknown
  if (raw.format === 'kotoba-deck') {
    deck = raw.deck
    cards = raw.cards
  } else if (Array.isArray(raw.decks) && Array.isArray(raw.cards) && raw.decks.length === 1) {
    deck = raw.decks[0]
    cards = raw.cards
  } else {
    return null
  }
  if (!isObj(deck) || !Array.isArray(cards)) return null

  const normalized = normalizeImported({
    version: 2,
    decks: [deck],
    cards,
  })
  if (normalized.decks.length !== 1) return null
  const target = normalized.decks[0]
  return {
    deck: { ...target, builtin: false },
    cards: normalized.cards.filter((card) => card.deckId === target.id),
  }
}

function uniqueDeckName(names: string[], base: string): string {
  const root = base.trim() || 'Imported deck'
  const used = new Set(names)
  if (!used.has(root)) return root
  let index = 2
  while (used.has(`${root} (${index})`)) index += 1
  return `${root} (${index})`
}

/** Добавляет колоду из файла как новую. ID и прогресс сбрасываются. */
export function importDeckTransfer(
  current: AppData,
  parsed: ParsedDeckTransfer,
  existingNames = current.decks.map((deck) => deck.name),
): { data: AppData; deckId: string } {
  const now = Date.now()
  const deckId = uid('deck')
  const deck: Deck = {
    ...parsed.deck,
    id: deckId,
    name: uniqueDeckName(existingNames, parsed.deck.name),
    builtin: false,
    createdAt: now,
  }
  const cards: Card[] = parsed.cards.map((card, index) => ({
    ...card,
    id: uid('card'),
    deckId,
    order: index + 1,
    createdAt: now + index,
    srs: freshSrs(),
  }))

  return {
    data: {
      ...current,
      decks: [...current.decks, deck],
      cards: [...current.cards, ...cards],
    },
    deckId,
  }
}
