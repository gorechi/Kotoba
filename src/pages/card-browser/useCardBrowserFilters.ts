import { useEffect, useMemo, useState } from 'react'
import type { Card, Deck } from '../../types'
import type { Translate } from '../../lib/i18n'
import {
  MAX_TAGS_COLLAPSED,
  PAGE_SIZE,
  cardSearchText,
  type SortKey,
  type StatusKey,
  type TypeFilter,
} from '../../lib/card-browser'

export function useCardBrowserFilters(
  cards: Card[],
  decks: Deck[],
  t: Translate,
  intl: string,
) {
  const [query, setQuery] = useState('')
  const [deckFilter, setDeckFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all')
  const [mnemonicOnly, setMnemonicOnly] = useState(false)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [sort, setSort] = useState<SortKey>('created-desc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const deckMap = useMemo(
    () => new Map(decks.map((deck) => [deck.id, deck])),
    [decks],
  )

  const deckCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const card of cards) {
      counts.set(card.deckId, (counts.get(card.deckId) ?? 0) + 1)
    }
    return counts
  }, [cards])

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const card of cards) {
      for (const tag of card.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], intl),
    )
  }, [cards, intl])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    const current = Date.now()
    const result = cards.filter((card) => {
      const deck = deckMap.get(card.deckId)
      if (!deck) return false
      if (deckFilter !== 'all' && card.deckId !== deckFilter) return false
      if (typeFilter !== 'all' && deck.kind !== typeFilter) return false
      if (statusFilter === 'suspended') {
        if (!card.suspended) return false
      } else if (statusFilter === 'new') {
        if (card.srs.introduced) return false
      } else if (statusFilter === 'learning') {
        if (!card.srs.introduced || card.srs.due <= current || card.srs.interval >= 21) {
          return false
        }
      } else if (statusFilter === 'due') {
        if (!card.srs.introduced || card.srs.due > current) return false
      } else if (statusFilter === 'learned') {
        if (!card.srs.introduced || card.srs.due <= current || card.srs.interval < 21) {
          return false
        }
      }
      if (mnemonicOnly && !card.mnemonic.trim()) return false
      if (activeTags.size > 0 && !card.tags.some((tag) => activeTags.has(tag))) return false
      if (search && !cardSearchText(card, t).includes(search)) return false
      return true
    })

    const compareText = (a: Card, b: Card) =>
      (a.reading || a.front).localeCompare(b.reading || b.front, intl)

    result.sort((a, b) => {
      switch (sort) {
        case 'created-asc':
          return a.createdAt - b.createdAt || a.order - b.order
        case 'front-asc':
          return compareText(a, b) || a.front.localeCompare(b.front, intl)
        case 'front-desc':
          return compareText(b, a) || b.front.localeCompare(a.front, intl)
        case 'interval-asc':
          return a.srs.interval - b.srs.interval || compareText(a, b)
        case 'interval-desc':
          return b.srs.interval - a.srs.interval || compareText(a, b)
        case 'lapses-desc':
          return b.srs.lapses - a.srs.lapses || b.srs.reps - a.srs.reps || compareText(a, b)
        case 'created-desc':
        default:
          return b.createdAt - a.createdAt || a.order - b.order
      }
    })

    return result
  }, [
    cards,
    deckMap,
    query,
    deckFilter,
    typeFilter,
    statusFilter,
    mnemonicOnly,
    activeTags,
    sort,
    intl,
    t,
  ])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, deckFilter, typeFilter, statusFilter, mnemonicOnly, activeTags, sort])

  return {
    query,
    setQuery,
    deckFilter,
    setDeckFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    mnemonicOnly,
    setMnemonicOnly,
    activeTags,
    setActiveTags,
    tagsExpanded,
    setTagsExpanded,
    sort,
    setSort,
    deckMap,
    deckCounts,
    allTags,
    filtered,
    visibleCards: filtered.slice(0, visibleCount),
    visibleTags: tagsExpanded ? allTags : allTags.slice(0, MAX_TAGS_COLLAPSED),
    visibleCount,
    setVisibleCount,
  }
}
