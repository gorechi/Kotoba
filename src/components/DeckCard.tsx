import type { CSSProperties, KeyboardEvent } from 'react'
import type { Deck } from '../types'
import type { DeckStat } from '../lib/stats'
import { useI18n } from '../lib/i18n-react'
import { deckDescription, deckTitle, isProtectedDeck } from '../lib/content'
import { Icon } from './Icon'

interface DeckCardProps {
  deck: Deck
  stat: DeckStat
  newCount: number
  dueCount?: number
  onOpen: () => void
  onStudy: () => void
}

export function DeckCard({ deck, stat, newCount, dueCount, onOpen, onStudy }: DeckCardProps) {
  const { t } = useI18n()
  const isKanji = deck.kind === 'kanji'
  const protectedDeck = isProtectedDeck(deck)
  const due = dueCount ?? stat.due
  const nothingToStudy = due === 0 && newCount === 0
  const practice = nothingToStudy && stat.learned > 0
  const empty = nothingToStudy && stat.learned === 0
  const cta = empty
    ? isKanji
      ? t('deckCard.noKanji')
      : t('deckCard.noCards')
    : practice
      ? t('common.practice')
      : t('common.study')
  const watermark = (deck.nameJp || deck.name || (isKanji ? '漢' : '言')).slice(0, 1)
  const title = deckTitle(deck, t)
  const description = deckDescription(deck, t)

  const handleKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <article
      className="deck-card"
      style={{ '--accent': deck.accent } as CSSProperties}
      onClick={onOpen}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
    >
      <span className="deck-watermark" aria-hidden="true">
        {watermark}
      </span>

      <div className="deck-head">
        <span className="deck-jp">{deck.nameJp || (isKanji ? '漢字' : '言葉')}</span>
        <div className="deck-badges">
          {due > 0 && <span className="badge">{t('deckCard.dueBadge', { n: due })}</span>}
          {newCount > 0 && (
            <span className="badge badge-soft">{t('deckCard.newBadge', { n: newCount })}</span>
          )}
          {nothingToStudy && <span className="badge badge-muted">{t('deckCard.allDone')}</span>}
        </div>
      </div>

      <h3 className="deck-name">{title}</h3>
      <p className="deck-desc">
        {description || (isKanji ? t('deckCard.defaultKanji') : t('deckCard.defaultCustom'))}
      </p>

      <div className="deck-progress">
        <div className="deck-progress-bar">
          <span style={{ width: `${stat.percent}%` }} />
        </div>
        <div className="deck-progress-label">
          <span>{t('deckCard.learnedOf', { learned: stat.learned, total: stat.total })}</span>
          <span>{stat.percent}%</span>
        </div>
      </div>

      <div className="deck-foot">
        <span className="deck-count">
          {protectedDeck
            ? t('deckCard.builtin')
            : t(isKanji ? 'count.kanji' : 'count.cards', { n: stat.total })}
        </span>
        <button
          className="btn btn-small btn-primary"
          disabled={empty}
          onClick={(event) => {
            event.stopPropagation()
            onStudy()
          }}
        >
          {cta}
          {!empty && <Icon name="arrow-right" size={15} />}
        </button>
      </div>
    </article>
  )
}
