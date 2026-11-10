import type { Card, Deck } from '../types'
import {
  createN5KanjiCards,
  createN5KanjiDeck,
  N5_KANJI_PACK_ID,
} from './kanji-n5'
import {
  createN4KanjiCards,
  createN4KanjiDeck,
  N4_KANJI_PACK_ID,
} from './kanji-n4'

export interface ContentPackState {
  decks: Deck[]
  cards: Card[]
  installedPacks: string[]
}

/**
 * Добавляет новые готовые наборы один раз.
 *
 * installedPacks хранится в данных приложения: после установки пользователь
 * может свободно редактировать или удалить колоду, и она не вернётся
 * при следующем запуске.
 */
export function installContentPacks(
  state: ContentPackState,
  now = Date.now(),
): ContentPackState {
  const decks = [...state.decks]
  const cards = [...state.cards]
  const installedPacks = [...state.installedPacks]
  let changed = false

  const installPack = (packId: string, deck: Deck, packCards: Card[]) => {
    if (installedPacks.includes(packId)) return
    if (!decks.some((item) => item.id === deck.id)) {
      decks.push(deck)
      cards.push(...packCards)
      changed = true
    }
    installedPacks.push(packId)
    changed = true
  }

  installPack(N5_KANJI_PACK_ID, createN5KanjiDeck(now), createN5KanjiCards(now))
  installPack(N4_KANJI_PACK_ID, createN4KanjiDeck(now), createN4KanjiCards(now))

  return changed
    ? { decks, cards, installedPacks }
    : state
}
