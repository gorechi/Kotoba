import type {
  DailyGoalProgress,
  DayPoint,
  MemoryStrengthStat,
  Milestone,
  PaceForecast,
  PersonalRecords,
  UpcomingDay,
} from '../lib/stats'
import { useI18n } from '../lib/i18n-react'
import { formatDuration } from '../lib/utils'
import { Icon, type IconName } from './Icon'

function shortDate(key: string, intl: string): string {
  return new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short' }).format(
    new Date(`${key}T12:00:00`),
  )
}

export function DailyGoalCard({
  progress,
  week,
}: {
  progress: DailyGoalProgress
  week: DayPoint[]
}) {
  const { t } = useI18n()
  const complete = progress.done >= progress.goal
  const remaining = Math.max(0, progress.goal - progress.done)
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress.percent / 100)
  const unit =
    progress.unit === 'minutes'
      ? t('stats.dailyGoalUnitMinutes')
      : t('stats.dailyGoalUnitReviews')
  const message = complete
    ? t('stats.dailyGoalDone')
    : t(
        progress.unit === 'minutes'
          ? 'stats.dailyGoalMinutesLeft'
          : 'stats.dailyGoalReviewsLeft',
        { n: remaining },
      )

  return (
    <section className={`panel goal-panel${complete ? ' is-complete' : ''}`}>
      <div className="panel-head">
        <div>
          <h2>{t('stats.dailyGoal')}</h2>
          <p>{t('stats.dailyGoalSub')}</p>
        </div>
      </div>

      <div className="goal-body">
        <div className="goal-ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle className="goal-ring-track" cx="50" cy="50" r={radius} />
            <circle
              className="goal-ring-value"
              cx="50"
              cy="50"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="goal-ring-center">
            <strong>{progress.done}</strong>
            <span>/ {progress.goal}</span>
            <small>{unit}</small>
          </div>
        </div>

        <div className="goal-copy">
          <p className={`goal-message${complete ? ' is-complete' : ''}`}>
            {complete && <Icon name="sparkles" size={15} />}
            {message}
          </p>
          <div className="goal-week">
            {week.map((point, index) => (
              <span
                className={`goal-week-day${point.reviews > 0 ? ' is-active' : ''}${
                  index === week.length - 1 ? ' is-today' : ''
                }`}
                key={point.key}
                title={point.key}
              >
                <i />
                <span>{point.weekday}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const MILESTONE_META: Record<Milestone['type'], { icon: IconName; labelKey: string }> = {
  reviews: { icon: 'layers', labelKey: 'stats.milestoneReviews' },
  cards: { icon: 'book', labelKey: 'stats.milestoneCards' },
  streak: { icon: 'flame', labelKey: 'stats.milestoneStreak' },
}

export function MilestoneCard({ milestone }: { milestone: Milestone | null }) {
  const { t } = useI18n()

  if (!milestone) {
    return (
      <section className="panel milestone-panel is-complete">
        <div className="panel-head">
          <div>
            <h2>{t('stats.milestoneTitle')}</h2>
            <p>{t('stats.milestoneSub')}</p>
          </div>
        </div>
        <div className="milestone-done">
          <span className="milestone-icon">
            <Icon name="trophy" size={24} />
          </span>
          <div>
            <strong>{t('stats.milestoneAllDone')}</strong>
            <p>{t('stats.milestoneAllDoneHint')}</p>
          </div>
        </div>
      </section>
    )
  }

  const meta = MILESTONE_META[milestone.type]

  return (
    <section className="panel milestone-panel">
      <div className="panel-head">
        <div>
          <h2>{t('stats.milestoneTitle')}</h2>
          <p>{t('stats.milestoneSub')}</p>
        </div>
        <span className="milestone-percent">{milestone.percent}%</span>
      </div>

      <div className="milestone-body">
        <span className={`milestone-icon milestone-icon--${milestone.type}`}>
          <Icon name={meta.icon} size={22} />
        </span>
        <div className="milestone-main">
          <div className="milestone-top">
            <span>{t(meta.labelKey)}</span>
            <strong>
              {milestone.current} / {milestone.target}
            </strong>
          </div>
          <div className="milestone-progress">
            <span style={{ width: `${milestone.percent}%` }} />
          </div>
          <p className="milestone-left">
            {t('stats.milestoneLeft', { n: milestone.remaining })}
          </p>
        </div>
      </div>
    </section>
  )
}

export function MemoryStrengthCard({ strength }: { strength: MemoryStrengthStat }) {
  const { t } = useI18n()
  const total = Math.max(1, strength.total)
  const segments = [
    {
      key: 'fresh',
      count: strength.fresh,
      label: t('stats.memoryNew'),
      className: 'memory-fresh',
    },
    {
      key: 'learning',
      count: strength.learning,
      label: t('stats.memoryLearning'),
      className: 'memory-learning',
    },
    {
      key: 'consolidating',
      count: strength.consolidating,
      label: t('stats.memoryConsolidating'),
      className: 'memory-consolidating',
    },
    {
      key: 'mature',
      count: strength.mature,
      label: t('stats.memoryMature'),
      className: 'memory-mature',
    },
  ]

  return (
    <section className="panel memory-panel">
      <div className="panel-head">
        <div>
          <h2>{t('stats.memoryTitle')}</h2>
          <p>{t('stats.memorySub')}</p>
        </div>
      </div>

      <div className={`memory-summary${strength.mature > 0 ? ' has-mature' : ''}`}>
        <strong>{strength.mature}</strong>
        <span>{t('stats.memoryMatureLabel')}</span>
      </div>

      <div className="memory-stack" aria-hidden="true">
        {segments.map((segment) =>
          segment.count > 0 ? (
            <span
              key={segment.key}
              className={`memory-segment ${segment.className}`}
              style={{ width: `${(segment.count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <div className="memory-legend">
        {segments.map((segment) => (
          <div className="memory-legend-item" key={segment.key}>
            <i className={`memory-dot ${segment.className}`} />
            <span>{segment.label}</span>
            <strong>{segment.count}</strong>
          </div>
        ))}
      </div>

      <p className="hint">{t('stats.memoryHint')}</p>
    </section>
  )
}

export function RecordsCard({ records }: { records: PersonalRecords }) {
  const { t, locale } = useI18n()
  const rows: { icon: IconName; label: string; value: string; sub: string }[] = [
    {
      icon: 'flame',
      label: t('stats.recordsBestDay'),
      value: records.bestDay
        ? t('stats.recordsReviews', { n: records.bestDay.reviews })
        : '—',
      sub: records.bestDay ? shortDate(records.bestDay.key, locale.intl) : '',
    },
    {
      icon: 'trophy',
      label: t('stats.recordsBestWeek'),
      value: records.bestWeek
        ? t('stats.recordsReviews', { n: records.bestWeek.reviews })
        : '—',
      sub: records.bestWeek
        ? t('stats.recordsWeekOf', { date: shortDate(records.bestWeek.startKey, locale.intl) })
        : '',
    },
    {
      icon: 'sparkles',
      label: t('stats.recordsLongestStreak'),
      value:
        records.longestStreak > 0
          ? t('stats.recordsStreak', { n: records.longestStreak })
          : '—',
      sub: '',
    },
    {
      icon: 'check',
      label: t('stats.recordsBestAccuracy'),
      value: records.bestAccuracy ? `${records.bestAccuracy.accuracy}%` : '—',
      sub: records.bestAccuracy
        ? shortDate(records.bestAccuracy.key, locale.intl)
        : t('stats.recordsAccuracyNeed'),
    },
  ]

  return (
    <section className="panel records-panel">
      <div className="panel-head">
        <div>
          <h2>{t('stats.recordsTitle')}</h2>
          <p>{t('stats.recordsSub')}</p>
        </div>
      </div>

      {records.bestDay ? (
        <div className="record-list">
          {rows.map((row) => (
            <div className="record-row" key={row.label}>
              <span className="record-icon">
                <Icon name={row.icon} size={18} />
              </span>
              <div className="record-main">
                <span>{row.label}</span>
                {row.sub && <small>{row.sub}</small>}
              </div>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note">{t('stats.recordsEmpty')}</p>
      )}
    </section>
  )
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function WeeklyRecapCard({ points }: { points: DayPoint[] }) {
  const { t } = useI18n()
  const current = points.slice(-7)
  const previous = points.slice(0, 7)

  const sum = (items: DayPoint[], key: 'reviews' | 'newCards' | 'ms' | 'correct') =>
    items.reduce((total, item) => total + item[key], 0)

  const reviews = sum(current, 'reviews')
  const prevReviews = sum(previous, 'reviews')
  const newCards = sum(current, 'newCards')
  const prevNewCards = sum(previous, 'newCards')
  const ms = sum(current, 'ms')
  const prevMs = sum(previous, 'ms')
  const correct = sum(current, 'correct')
  const prevCorrect = sum(previous, 'correct')
  const accuracy = reviews > 0 ? Math.round((correct / reviews) * 100) : null
  const prevAccuracy =
    prevReviews > 0 ? Math.round((prevCorrect / prevReviews) * 100) : null
  const activeDays = current.filter((point) => point.reviews > 0).length
  const maxReviews = Math.max(1, ...current.map((point) => point.reviews))

  const deltas = {
    reviews: deltaPercent(reviews, prevReviews),
    newCards: deltaPercent(newCards, prevNewCards),
    ms: deltaPercent(ms, prevMs),
    accuracy:
      accuracy !== null && prevAccuracy !== null ? accuracy - prevAccuracy : null,
  }

  const metrics = [
    {
      key: 'reviews',
      label: t('stats.recapReviews'),
      value: String(reviews),
      delta: deltas.reviews,
      hasValue: reviews > 0,
    },
    {
      key: 'newCards',
      label: t('stats.recapNewCards'),
      value: String(newCards),
      delta: deltas.newCards,
      hasValue: newCards > 0,
    },
    {
      key: 'ms',
      label: t('stats.recapTime'),
      value: formatDuration(ms),
      delta: deltas.ms,
      hasValue: ms > 0,
    },
    {
      key: 'accuracy',
      label: t('stats.recapAccuracy'),
      value: accuracy === null ? '—' : `${accuracy}%`,
      delta: deltas.accuracy,
      hasValue: accuracy !== null,
    },
  ]

  return (
    <section className="panel recap-panel">
      <div className="panel-head">
        <div>
          <h2>{t('stats.recapTitle')}</h2>
          <p>{t('stats.recapSub')}</p>
        </div>
        <span className="chart-total">
          {t('stats.recapActiveDays', { n: activeDays })}
        </span>
      </div>

      <div className="recap-grid">
        {metrics.map((metric) => (
          <div className="recap-metric" key={metric.key}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            {metric.delta !== null ? (
              <small
                className={`recap-delta ${
                  metric.delta > 0 ? 'is-up' : metric.delta < 0 ? 'is-down' : 'is-flat'
                }`}
                title={t('stats.recapVsPrevious')}
              >
                {metric.delta > 0 ? '+' : ''}
                {metric.delta}
                {metric.key === 'accuracy' ? t('stats.recapPts') : '%'}
              </small>
            ) : metric.hasValue ? (
              <small className="recap-delta is-up">{t('stats.recapNew')}</small>
            ) : (
              <small className="recap-delta is-flat">—</small>
            )}
          </div>
        ))}
      </div>

      <div className="recap-bars" aria-hidden="true">
        {current.map((point) => (
          <div className="recap-col" key={point.key}>
            <div className="recap-track">
              <span
                className={`recap-bar${point.reviews === 0 ? ' is-empty' : ''}`}
                style={{ height: `${Math.max(4, Math.round((point.reviews / maxReviews) * 100))}%` }}
              />
            </div>
            <span className="recap-day">{point.weekday}</span>
          </div>
        ))}
      </div>

      {prevReviews === 0 && reviews > 0 && (
        <p className="recap-note">{t('stats.recapFirstWeek')}</p>
      )}
    </section>
  )
}

export function PlanPanel({
  forecast,
  upcoming,
}: {
  forecast: PaceForecast
  upcoming: UpcomingDay[]
}) {
  const { t } = useI18n()
  const maxUpcoming = Math.max(1, ...upcoming.map((day) => day.count))
  const hasUpcoming = upcoming.some((day) => day.count > 0)
  const pace = Math.round(forecast.pace * 10) / 10

  return (
    <section className="panel plan-panel">
      <div className="plan-grid">
        <div className="plan-column">
          <div className="panel-head">
            <div>
              <h2>{t('stats.forecastTitle')}</h2>
              <p>{t('stats.forecastSub')}</p>
            </div>
          </div>

          {forecast.remaining === 0 ? (
            <div className="forecast-done">
              <span className="milestone-icon">
                <Icon name="check" size={22} />
              </span>
              <p>{t('stats.forecastDone')}</p>
            </div>
          ) : (
            <div className="forecast-body">
              <div className="forecast-days">
                <strong>{forecast.days ?? '—'}</strong>
                <span>
                  {t('stats.forecastDaysUnit', { n: forecast.days ?? 0 })}
                </span>
              </div>
              <p className="forecast-remaining">
                {t('stats.forecastRemaining', { n: forecast.remaining })}
              </p>
              <p className="forecast-pace">{t('stats.forecastPace', { n: pace })}</p>
              <div className="forecast-progress">
                <span
                  style={{
                    width: `${forecast.total > 0 ? (forecast.learned / forecast.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="hint">{t('stats.forecastHint')}</p>
            </div>
          )}
        </div>

        <div className="plan-column">
          <div className="panel-head">
            <div>
              <h2>{t('stats.upcomingTitle')}</h2>
              <p>{t('stats.upcomingSub')}</p>
            </div>
          </div>

          {hasUpcoming ? (
            <div className="upcoming-bars">
              {upcoming.map((day) => (
                <div className="upcoming-col" key={day.key}>
                  <span className="upcoming-count">{day.count}</span>
                  <div className="upcoming-track">
                    <span
                      className={`upcoming-bar${day.count === 0 ? ' is-empty' : ''}`}
                      style={{
                        height: `${Math.max(4, Math.round((day.count / maxUpcoming) * 100))}%`,
                      }}
                      title={t('stats.upcomingCards', { n: day.count })}
                    />
                  </div>
                  <span className={`upcoming-label${day.isToday ? ' is-today' : ''}`}>
                    {day.isToday ? t('stats.upcomingToday') : day.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">{t('stats.upcomingEmpty')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
