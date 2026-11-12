import { useMemo } from 'react'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { cardMeaning, deckTitle } from '../lib/content'
import { problemCards } from '../lib/problems'
import { Icon } from '../components/Icon'
import { Select } from '../components/Select'

interface ProblemCardsProps {
  onStudy: () => boolean
  onOpenCard: (cardId: string) => void
}

const PAUSE_OPTIONS = [0, 3, 5, 10, 15]

export function ProblemCards({ onStudy, onOpenCard }: ProblemCardsProps) {
  const { data, update, setSettings } = useStore()
  const { t, locale } = useI18n()
  const now = Date.now()
  const problems = useMemo(() => problemCards(data.cards, now), [data.cards, now])
  const paused = problems.filter((card) => card.suspended).length
  const active = problems.length - paused

  const dateFormatter = new Intl.DateTimeFormat(locale.intl, { dateStyle: 'medium' })

  const setSuspended = (cardId: string, suspended: boolean) => {
    update((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === cardId ? { ...card, suspended } : card,
      ),
    }))
  }

  return (
    <div className="page problems-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('problemCards.eyebrow')}</div>
          <h1>{t('problemCards.title')}</h1>
          <p className="page-sub">{t('problemCards.subtitle')}</p>
        </div>
        <div className="page-head-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onStudy()}
            disabled={active === 0}
          >
            <Icon name="arrow-right" size={17} />
            {t('problemCards.study')}
          </button>
        </div>
      </header>

      <section className="panel problems-summary">
        <div className="problems-stats">
          <div>
            <strong>{problems.length}</strong>
            <span>{t('problemCards.total')}</span>
          </div>
          <div>
            <strong>{active}</strong>
            <span>{t('problemCards.active')}</span>
          </div>
          <div>
            <strong>{paused}</strong>
            <span>{t('problemCards.paused')}</span>
          </div>
        </div>

        <div className="problems-pause-setting">
          <div>
            <strong>{t('problemCards.autoPause')}</strong>
            <p className="hint">{t('problemCards.autoPauseHint')}</p>
          </div>
          <Select
            value={String(data.settings.leechThreshold)}
            aria-label={t('problemCards.autoPause')}
            onChange={(event) =>
              setSettings({ leechThreshold: Number(event.target.value) })
            }
          >
            {PAUSE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value === 0
                  ? t('problemCards.autoPauseOff')
                  : t('problemCards.autoPauseValue', { n: value })}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {problems.length === 0 ? (
        <p className="empty-note">{t('problemCards.empty')}</p>
      ) : (
        <div className="problems-list">
          {problems.map((card) => {
            const deck = data.decks.find((item) => item.id === card.deckId)
            const lastMistake = card.srs.lastMistakeAt
            return (
              <article
                className={`problem-row${card.suspended ? ' is-paused' : ''}`}
                key={card.id}
              >
                <span className="problem-front">{card.front}</span>
                <div className="problem-copy">
                  <div className="problem-title">
                    <strong>{card.reading || cardMeaning(card, t) || card.front}</strong>
                    {card.suspended && (
                      <span className="badge badge-soft">{t('problemCards.pausedBadge')}</span>
                    )}
                  </div>
                  <span className="problem-meta">
                    {deck ? deckTitle(deck, t) : t('common.deck')}
                    {card.reading && cardMeaning(card, t)
                      ? ` · ${cardMeaning(card, t)}`
                      : ''}
                  </span>
                  {lastMistake && (
                    <span className="problem-meta">
                      {t('problemCards.lastMistake', {
                        date: dateFormatter.format(new Date(lastMistake)),
                      })}
                    </span>
                  )}
                </div>
                <span className="problem-lapses">
                  <Icon name="alert" size={14} />
                  {t('problemCards.lapses', { n: card.srs.lapses })}
                </span>
                <div className="problem-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => onOpenCard(card.id)}
                  >
                    <Icon name="eye" size={14} />
                    {t('problemCards.open')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => setSuspended(card.id, !card.suspended)}
                  >
                    <Icon name={card.suspended ? 'rotate' : 'pause'} size={14} />
                    {card.suspended
                      ? t('problemCards.resume')
                      : t('problemCards.pause')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
