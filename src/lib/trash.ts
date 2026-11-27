import type { AppData, Card, TrashDeckEntry, TrashEntry } from '../types'

/** Сколько дней корзина хранится по умолчанию. */
export const DEFAULT_TRASH_RETENTION_DAYS = 10
/** Больше десяти дней в настройках выбрать нельзя. */
export const MAX_TRASH_RETENTION_DAYS = 10

/**
 * Оставляет только свежие записи и убирает повторы.
 * `retentionDays = 0` — не удалять автоматически ничего.
 * Записи идут от новых к старым, поэтому при повторе сохраняется свежая.
 */
export function pruneTrash(
  entries: TrashEntry[],
  now = Date.now(),
  retentionDays = DEFAULT_TRASH_RETENTION_DAYS,
): TrashEntry[] {
  const cutoff =
    retentionDays > 0 ? now - retentionDays * 24 * 60 * 60 * 1000 : Number.NEGATIVE_INFINITY
  const seen = new Set<string>()
  const result: TrashEntry[] = []
  for (const entry of entries) {
    if (!entry || entry.deletedAt < cutoff) continue
    const key = `${entry.kind}:${entry.id}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(entry)
  }
  return result
}

/** Переносит карточки в корзину и убирает их из колод. */
export function trashCards(current: AppData, ids: Iterable<string>): AppData {
  const idSet = new Set(ids)
  if (idSet.size === 0) return current

  const removed = current.cards.filter((card) => idSet.has(card.id))
  if (removed.length === 0) return current

  const now = Date.now()
  const kept = current.trash.filter(
    (entry) => !(entry.kind === 'card' && idSet.has(entry.id)),
  )
  const entries: TrashEntry[] = removed.map((card) => ({
    id: card.id,
    kind: 'card',
    deletedAt: now,
    card,
  }))

  return {
    ...current,
    cards: current.cards.filter((card) => !idSet.has(card.id)),
    trash: pruneTrash([...entries, ...kept], now, current.settings.trashRetentionDays),
  }
}

/**
 * Переносит колоду в корзину вместе со всеми карточками.
 * Карточки, удалённые по одной раньше, переезжают внутрь записи колоды:
 * так восстановление колоды возвращает её целиком, без «висячих» записей.
 */
export function trashDeck(current: AppData, deckId: string): AppData {
  const deck = current.decks.find((item) => item.id === deckId)
  if (!deck) return current

  const now = Date.now()
  const ownCards = current.cards.filter((card) => card.deckId === deckId)

  const adopted: Card[] = []
  const kept: TrashEntry[] = []
  for (const entry of current.trash) {
    if (entry.kind === 'deck' && entry.id === deckId) continue
    if (entry.kind === 'card' && entry.card.deckId === deckId) {
      adopted.push(entry.card)
      continue
    }
    kept.push(entry)
  }

  const seen = new Set<string>()
  const cards = [...ownCards, ...adopted].filter((card) => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })

  const entry: TrashDeckEntry = {
    id: deckId,
    kind: 'deck',
    deletedAt: now,
    deck,
    cards,
  }

  return {
    ...current,
    decks: current.decks.filter((item) => item.id !== deckId),
    cards: current.cards.filter((card) => card.deckId !== deckId),
    trash: pruneTrash([entry, ...kept], now, current.settings.trashRetentionDays),
  }
}

type RestoreResult = {
  data: AppData
  restored: boolean
  /** Причина отказа: колода, в которую возвращалась карточка, удалена. */
  reason?: 'deck-missing'
}

/** Возвращает запись из корзины в колоды и карточки. */
export function restoreTrashEntry(current: AppData, entryId: string): RestoreResult {
  const entry = current.trash.find((item) => item.id === entryId)
  if (!entry) return { data: current, restored: false }

  const trash = current.trash.filter((item) => item.id !== entryId)

  if (entry.kind === 'card') {
    const deckExists = current.decks.some((deck) => deck.id === entry.card.deckId)
    if (!deckExists) return { data: current, restored: false, reason: 'deck-missing' }

    const cardExists = current.cards.some((card) => card.id === entry.card.id)
    return {
      data: {
        ...current,
        cards: cardExists ? current.cards : [...current.cards, entry.card],
        trash,
      },
      restored: true,
    }
  }

  const deckExists = current.decks.some((deck) => deck.id === entry.deck.id)
  const cardIds = new Set(current.cards.map((card) => card.id))
  const cards = entry.cards.filter((card) => !cardIds.has(card.id))

  return {
    data: {
      ...current,
      decks: deckExists ? current.decks : [...current.decks, entry.deck],
      cards: [...current.cards, ...cards],
      trash,
    },
    restored: true,
  }
}

/** Удаляет одну запись корзины навсегда. */
export function removeTrashEntry(current: AppData, entryId: string): AppData {
  return { ...current, trash: current.trash.filter((entry) => entry.id !== entryId) }
}

/** Очищает корзину целиком. */
export function emptyTrash(current: AppData): AppData {
  if (current.trash.length === 0) return current
  return { ...current, trash: [] }
}
