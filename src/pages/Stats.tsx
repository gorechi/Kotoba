import { useStore } from '../state/store'
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
import { plural } from '../lib/srs'
import { formatDuration } from '../lib/utils'

export function Stats() {
  const { data } = useStore()
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

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Прогресс</div>
          <h1>Статистика</h1>
          <p className="page-sub">Немного цифр, чтобы видеть, как растёт японский.</p>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-tile">
          <span className={`stat-tile-icon${days > 0 ? ' flame-lit' : ''}`}>
            <Icon name="flame" size={22} />
          </span>
          <strong>{days}</strong>
          <span>{plural(days, 'день', 'дня', 'дней')} подряд</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon">
            <Icon name="check" size={22} />
          </span>
          <strong>{today.reviews}</strong>
          <span>{plural(today.reviews, 'повторение', 'повторения', 'повторений')} сегодня</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon">
            <Icon name="chart" size={22} />
          </span>
          <strong>{weekAccuracy === null ? '—' : `${weekAccuracy}%`}</strong>
          <span>точность за 7 дней</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon">
            <Icon name="book" size={22} />
          </span>
          <strong>{overall.learned}</strong>
          <span>из {overall.total} карточек выучено</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Активность</h2>
            <p>Повторения за последние 14 дней</p>
          </div>
          <span className="chart-total">
            {last14} за две недели
            {writing14 > 0 ? ` · письмо ${writing14}` : ''}
          </span>
        </div>

        <div className="chart-legend">
          <span>
            <i className="legend-dot reading" />
            чтение
          </span>
          <span>
            <i className="legend-dot writing" />
            письмо
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
                title={`${point.key}: ${point.reviews} повторений — чтение ${point.readingReviews}, письмо ${point.writingReviews}`}
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

        {reviewsTotal === 0 && (
          <p className="empty-note chart-empty">
            Пока нет повторений — начни учиться, и здесь появится история.
          </p>
        )}
      </section>

      <section className="panel writing-panel">
        <div className="panel-head">
          <div>
            <h2>
              <i className="legend-dot writing" />
              Письмо
            </h2>
            <p>Отдельная статистика режима письма</p>
          </div>
          <span className="chart-total">сегодня {writingToday.reviews}</span>
        </div>

        <div className="mode-stats">
          <div>
            <strong>{writingToday.reviews}</strong>
            <span>повторений сегодня</span>
          </div>
          <div>
            <strong>{writing14}</strong>
            <span>за две недели</span>
          </div>
          <div>
            <strong>{writingAccuracy === null ? '—' : `${writingAccuracy}%`}</strong>
            <span>точность за 7 дней</span>
          </div>
          <div>
            <strong>{formatDuration(writingTimeTotal)}</strong>
            <span>время письма</span>
          </div>
        </div>
      </section>

      <div className="stats-columns">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>По колодам</h2>
              <p>Сколько карточек уже в работе</p>
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
                      <strong>{deck.name}</strong>
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
              <h2>Всего</h2>
              <p>За всё время</p>
            </div>
          </div>

          <dl className="facts">
            <div>
              <dt>Повторений</dt>
              <dd>{reviewsTotal}</dd>
            </div>
            <div>
              <dt>Время учёбы</dt>
              <dd>{formatDuration(timeTotal)}</dd>
            </div>
            <div>
              <dt>Карточек выучено</dt>
              <dd>
                {overall.learned} / {overall.total}
              </dd>
            </div>
            <div>
              <dt>Новых карточек в день</dt>
              <dd>{data.settings.newPerDay}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
