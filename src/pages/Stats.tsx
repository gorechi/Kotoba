import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { Icon } from '../components/Icon'
import {
  accuracy,
  dayModeStat,
  deckStat,
  lastDays,
  modeAccuracy,
  overallStat,
  streak,
  todayStat,
  totalModeStudyTime,
  totalReviews,
  totalStudyTime,
} from '../lib/stats'
import { formatDuration } from '../lib/utils'

export function Stats() {
  const { data } = useStore()
  const { t } = useI18n()
  const now = Date.now()
  const overall = overallStat(data.cards, now)
  const today = todayStat(data, now)
  const days = streak(data.history, now)
  const weekAccuracy = accuracy(data.history, 7, now)
  const points = lastDays(data.history, 14, now)
  const max = Math.max(5, ...points.map((point) => point.reviews))
  const reviewsTotal = totalReviews(data.history)
  const timeTotal = totalStudyTime(data.history)
  const last14 = points.reduce((sum, point) => sum + point.reviews, 0)
  const todayKey = points[points.length - 1]?.key
  const writingToday = dayModeStat(todayKey ? data.history[todayKey] : undefined, 'writing')
  const writing14 = points.reduce((sum, point) => sum + point.writingReviews, 0)
  const writingAccuracy = modeAccuracy(data.history, 'writing', 7, now)
  const writingTimeTotal = totalModeStudyTime(data.history, 'writing')
  const decks = [...data.decks].sort(
    (a, b) => Number(b.builtin) - Number(a.builtin) || a.createdAt - b.createdAt,
  )

  const percent = (value: number | null) => (value === null ? '—' : `${value}%`)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('stats.eyebrow')}</div>
          <h1>{t('stats.title')}</h1>
          <p className="page-sub">{t('stats.subtitle')}</p>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-tile">
          <span className={`stat-tile-icon${days > 0 ? ' flame-lit' : ''}`}>
            <Icon name="flame" size={22} />
          </span>
          <strong>{days}</strong>
          <span>{t('stats.streak', { n: days })}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon">
            <Icon name="check" size={22} />
          </span>
          <strong>{today.reviews}</strong>
          <span>{t('stats.reviewsToday', { n: today.reviews })}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon">
            <Icon name="chart" size={22} />
          </span>
          <strong>{percent(weekAccuracy)}</strong>
          <span>{t('stats.accuracy7')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon">
            <Icon name="book" size={22} />
          </span>
          <strong>{overall.learned}</strong>
          <span>{t('stats.learnedOf', { total: overall.total })}</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t('stats.activity')}</h2>
            <p>{t('stats.activitySub')}</p>
          </div>
          <span className="chart-total">
            {t('stats.weekTotal', { n: last14 })}
            {writing14 > 0 ? t('stats.writingInline', { n: writing14 }) : ''}
          </span>
        </div>

        <div className="chart-legend">
          <span>
            <i className="legend-dot reading" />
            {t('stats.reading')}
          </span>
          <span>
            <i className="legend-dot writing" />
            {t('stats.writing')}
          </span>
        </div>

        <div className="chart">
          {points.map((point) => {
            const height = Math.max(3, Math.round((point.reviews / max) * 100))
            const writingShare = point.reviews
              ? (point.writingReviews / point.reviews) * 100
              : 0
            return (
              <div
                className={`chart-col${point.key === todayKey ? ' today' : ''}`}
                key={point.key}
                title={t('stats.chartTitle', {
                  key: point.key,
                  reviews: point.reviews,
                  reading: point.readingReviews,
                  writing: point.writingReviews,
                })}
              >
                <div className="chart-bar-track">
                  <div
                    className={`chart-bar${point.reviews === 0 ? ' empty' : ''}`}
                    style={{ height: `${height}%` }}
                  >
                    {point.writingReviews > 0 && (
                      <span
                        className="chart-bar-writing"
                        style={{ height: `${writingShare}%` }}
                      />
                    )}
                    {point.reviews > 0 && <span className="chart-value">{point.reviews}</span>}
                  </div>
                </div>
                <span className="chart-label">{point.day}</span>
              </div>
            )
          })}
        </div>

        {reviewsTotal === 0 && <p className="empty-note chart-empty">{t('stats.chartEmpty')}</p>}
      </section>

      <section className="panel writing-panel">
        <div className="panel-head">
          <div>
            <h2>
              <i className="legend-dot writing" />
              {t('stats.writingPanel')}
            </h2>
            <p>{t('stats.writingPanelSub')}</p>
          </div>
          <span className="chart-total">{t('stats.today', { n: writingToday.reviews })}</span>
        </div>

        <div className="mode-stats">
          <div>
            <strong>{writingToday.reviews}</strong>
            <span>{t('stats.reviewsTodayLabel')}</span>
          </div>
          <div>
            <strong>{writing14}</strong>
            <span>{t('stats.twoWeeks')}</span>
          </div>
          <div>
            <strong>{percent(writingAccuracy)}</strong>
            <span>{t('stats.accuracy7short')}</span>
          </div>
          <div>
            <strong>{formatDuration(writingTimeTotal)}</strong>
            <span>{t('stats.writingTime')}</span>
          </div>
        </div>
      </section>

      <div className="stats-columns">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t('stats.byDeck')}</h2>
              <p>{t('stats.byDeckSub')}</p>
            </div>
          </div>

          <div className="deck-rows">
            {decks.map((deck) => {
              const stat = deckStat(data.cards, deck.id, now)
              return (
                <div className="deck-row" key={deck.id}>
                  <span className="deck-dot" style={{ background: deck.accent }} />
                  <div className="deck-row-main">
                    <div className="deck-row-top">
                      <strong>{deckTitle(deck, t)}</strong>
                      <span>
                        {stat.learned} / {stat.total}
                      </span>
                    </div>
                    <div className="mini-bar">
                      <span style={{ width: `${stat.percent}%`, background: deck.accent }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t('stats.total')}</h2>
              <p>{t('stats.allTime')}</p>
            </div>
          </div>

          <dl className="facts">
            <div>
              <dt>{t('stats.reviews')}</dt>
              <dd>{reviewsTotal}</dd>
            </div>
            <div>
              <dt>{t('stats.studyTime')}</dt>
              <dd>{formatDuration(timeTotal)}</dd>
            </div>
            <div>
              <dt>{t('stats.cardsLearned')}</dt>
              <dd>
                {overall.learned} / {overall.total}
              </dd>
            </div>
            <div>
              <dt>{t('stats.newPerDay')}</dt>
              <dd>{data.settings.newPerDay}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
