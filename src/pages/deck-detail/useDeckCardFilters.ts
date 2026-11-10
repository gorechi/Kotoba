import { useMemo, useState } from 'react'
import type { Card } from '../../types'
import type { Translate } from '../../lib/i18n'
import { cardExampleTranslation, cardMeaning } from '../../lib/content'

export type DeckStatusFilter = 'all' | 'new' | 'due' | 'learned'

export const DECK_TAGS_COLLAPSED = 6

export function useDeckCardFilters(cards: Card[], now: number, t: Translate) {
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<DeckStatusFilter>('all')
  const [tagsExpanded, setTagsExpanded] = useState(false)

  const tagFrequency = useMemo(() => {
    const counts = new Map<string, number>()
    for (const card of cards) {
      for (const tag of card.tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      }
    }
    return counts
  }, [cards])

  const sortedTags = useMemo(() => {
    const unique = new Set<string>()
    for (const card of cards) {
      for (const tag of card.tags) unique.add(tag)
    }
    return [...unique].sort((a, b) => {
      const countA = tagFrequency.get(a) ?? 0
      const countB = tagFrequency.get(b) ?? 0
      return countB - countA || a.localeCompare(b)
    })
  }, [cards, tagFrequency])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return cards.filter((card) => {
      if (search) {
        const readingsText = card.readings
          .map((item) => `${item.kana} ${item.transcription}`)
          .join(' ')
        const examplesText = card.examples
          .map(
            (item) =>
              `${item.text} ${item.transcription} ${cardExampleTranslation(card, item, t)}`,
          )
          .join(' ')
        const text =
          `${card.front} ${card.reading} ${cardMeaning(card, t)} ${card.note} ${card.mnemonic} ${readingsText} ${examplesText}`.toLowerCase()
        if (!text.includes(search)) return false
      }
      if (activeTags.size > 0 && !card.tags.some((tag) => activeTags.has(tag))) {
        return false
      }
      if (statusFilter === 'new' && card.srs.introduced) return false
      if (statusFilter === 'due' && (!card.srs.introduced || card.srs.due > now)) {
        return false
      }
      if (
        statusFilter === 'learned' &&
        (!card.srs.introduced || card.srs.due <= now)
      ) {
        return false
      }
      return true
    })
  }, [cards, query, activeTags, statusFilter, now, t])

  return {
    query,
    setQuery,
    activeTags,
    setActiveTags,
    statusFilter,
    setStatusFilter,
    tagsExpanded,
    setTagsExpanded,
    tagFrequency,
    sortedTags,
    filtered,
    visibleTags: tagsExpanded ? sortedTags : sortedTags.slice(0, DECK_TAGS_COLLAPSED),
  }
}
