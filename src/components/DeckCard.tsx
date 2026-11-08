import type { CSSProperties, KeyboardEvent } from 'react'
import type { Deck } from '../types'
import type { DeckStat } from '../lib/stats'
import { plural } from '../lib/srs'
import { Icon } from './Icon'

interface DeckCardProps {
  deck: Deck
  stat: DeckStat
  newCount: number
  onOpen: () => void
  onStudy: () => void
}

export function DeckCard({ deck, stat, newCount, onOpen, onStudy }: DeckCardProps) {
  const isKanji = deck.kind === 'kanji'
  const nothingToStudy = stat.due === 0 && newCount === 0
  const practice = nothingToStudy && stat.learned > 0
  const empty = nothingToStudy && stat.learned === 0
  const cta = empty ? (isKanji ? 'Нет иероглифов' : 'Нет карточек') : practice ? 'Тренировать' : 'Учить'
  const watermark = (deck.nameJp || deck.name || (isKanji ? '漢' : '言')).slice(0, 1)

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
          {stat.due > 0 && <span className="badge">{stat.due} к повторению</span>}
          {newCount > 0 && <span className="badge badge-soft">{newCount} новых</span>}
          {nothingToStudy && <span className="badge badge-muted">на сегодня всё</span>}
        </div>
      </div>

      <h3 className="deck-name">{deck.name}</h3>
      <p className="deck-desc">
        {deck.description || (isKanji ? 'Колода кандзи' : 'Своя колода')}
      </p>

      <div className="deck-progress">
        <div className="deck-progress-bar">
          <span style={{ width: `${stat.percent}%` }} />
        </div>
        <div className="deck-progress-label">
          <span>
            {stat.learned} из {stat.total}
          </span>
          <span>{stat.percent}%</span>
        </div>
      </div>

      <div className="deck-foot">
        <span className="deck-count">
          {deck.builtin
            ? 'встроенная'
            : `${stat.total} ${
                isKanji
                  ? plural(stat.total, 'иероглиф', 'иероглифа', 'иероглифов')
                  : plural(stat.total, 'карточка', 'карточки', 'карточек')
              }`}
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
