import type { Card } from '../types'
import type { Translate } from './i18n'
import { cardExampleTranslation, cardMeaning } from './content'

export type SortKey =
  | 'created-desc'
  | 'created-asc'
  | 'front-asc'
  | 'front-desc'
  | 'interval-asc'
  | 'interval-desc'
  | 'lapses-desc'

export type StatusKey = 'all' | 'new' | 'learning' | 'due' | 'learned' | 'suspended'
export type TypeFilter = 'all' | 'kana' | 'kanji'
export type CardStatus = 'new' | 'learning' | 'due' | 'learned'

export const MAX_TAGS_COLLAPSED = 8
export const PAGE_SIZE = 100

export const SORT_OPTIONS: { value: SortKey; labelKey: string }[] = [
  { value: 'created-desc', labelKey: 'browser.sortNewest' },
  { value: 'created-asc', labelKey: 'browser.sortOldest' },
  { value: 'front-asc', labelKey: 'browser.sortAlphabet' },
  { value: 'front-desc', labelKey: 'browser.sortAlphabetDesc' },
  { value: 'interval-asc', labelKey: 'browser.sortInterval' },
  { value: 'interval-desc', labelKey: 'browser.sortIntervalDesc' },
  { value: 'lapses-desc', labelKey: 'browser.sortLapses' },
]

export const STATUS_FILTERS: { value: StatusKey; labelKey: string }[] = [
  { value: 'all', labelKey: 'browser.statusAll' },
  { value: 'new', labelKey: 'browser.statusNew' },
  { value: 'learning', labelKey: 'browser.statusLearning' },
  { value: 'due', labelKey: 'browser.statusDue' },
  { value: 'learned', labelKey: 'browser.statusLearned' },
  { value: 'suspended', labelKey: 'browser.statusSuspended' },
]

export const STATUS_LABEL_KEY: Record<CardStatus, string> = {
  new: 'browser.statusNew',
  learning: 'browser.statusLearning',
  due: 'browser.statusDue',
  learned: 'browser.statusLearned',
}

export function cardStatus(card: Card, now: number): CardStatus {
  if (!card.srs.introduced) return 'new'
  if (card.srs.due <= now) return 'due'
  if (card.srs.interval >= 21) return 'learned'
  return 'learning'
}

export function cardSearchText(card: Card, t: Translate): string {
  const readings = card.readings
    .map((item) => `${item.kana} ${item.transcription}`)
    .join(' ')
  const examples = card.examples
    .map(
      (item) =>
        `${item.text} ${item.transcription} ${cardExampleTranslation(card, item, t)}`,
    )
    .join(' ')
  return `${card.front} ${card.reading} ${cardMeaning(card, t)} ${card.note} ${card.mnemonic} ${card.tags.join(' ')} ${readings} ${examples}`.toLowerCase()
}
