import type { Card, Deck, TextMark } from '../types'

interface Candidate {
  front: string
  cardIds: string[]
}

/** Карточки, которые участвуют в связывании текста. Стандартные азбуки не считаем. */
export function cardsForTextSearch(cards: Card[], decks: Deck[]): Card[] {
  const ignored = new Set(
    decks
      .filter((deck) => deck.builtin && deck.kind === 'kana')
      .map((deck) => deck.id),
  )
  return cards.filter((card) => !ignored.has(card.deckId))
}

/**
 * Ищет в тексте точные совпадения с написанием карточек.
 * Сначала побеждает более длинная фраза, затем — все карточки с тем же написанием.
 */
export function buildTextMarks(body: string, cards: Card[]): TextMark[] {
  if (!body) return []

  const grouped = new Map<string, string[]>()
  for (const card of cards) {
    const front = card.front.trim()
    if (!front) continue
    const ids = grouped.get(front)
    if (!ids) {
      grouped.set(front, [card.id])
      continue
    }
    if (!ids.includes(card.id)) ids.push(card.id)
  }
  if (grouped.size === 0) return []

  const byFirst = new Map<string, Candidate[]>()
  for (const [front, cardIds] of grouped) {
    const first = front[0]
    const candidates = byFirst.get(first)
    const item = { front, cardIds }
    if (!candidates) byFirst.set(first, [item])
    else candidates.push(item)
  }
  for (const candidates of byFirst.values()) {
    candidates.sort((a, b) => b.front.length - a.front.length)
  }

  const marks: TextMark[] = []
  let index = 0
  while (index < body.length) {
    const candidates = byFirst.get(body[index])
    if (candidates) {
      const match = candidates.find((item) => body.startsWith(item.front, index))
      if (match) {
        marks.push({
          start: index,
          end: index + match.front.length,
          cardIds: [...match.cardIds],
        })
        index += match.front.length
        continue
      }
    }
    index += 1
  }
  return marks
}

function overlaps(a: TextMark, b: TextMark): boolean {
  return a.start < b.end && b.start < a.end
}

/** Ручные пометки важнее автоматических: перекрытые автоматические убираются. */
export function mergeTextMarks(automatic: TextMark[], manual: TextMark[]): TextMark[] {
  const activeManual = manual.filter((mark) => mark.cardIds.length > 0)
  const automaticKept = automatic.filter(
    (mark) => !activeManual.some((manualMark) => overlaps(mark, manualMark)),
  )
  return [...automaticKept, ...activeManual].sort((a, b) => a.start - b.start)
}

export function sameMarks(a: TextMark[], b: TextMark[]): boolean {
  if (a.length !== b.length) return false
  return a.every((mark, index) => {
    const other = b[index]
    return (
      mark.start === other.start &&
      mark.end === other.end &&
      Boolean(mark.manual) === Boolean(other.manual) &&
      mark.cardIds.length === other.cardIds.length &&
      mark.cardIds.every((id, cardIndex) => id === other.cardIds[cardIndex])
    )
  })
}
