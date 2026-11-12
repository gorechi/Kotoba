import type { Route } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { CustomStudy } from '../components/CustomStudy'
import { Icon } from '../components/Icon'
import type { CustomStudyOptions } from '../lib/custom-study'
import { dailyGoalProgress, overallStat, streak, todayStat } from '../lib/stats'
import { buildStudyQueue } from '../lib/study'
import { formatDate, greeting } from '../lib/utils'

interface HomeProps {
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
  onCustomStudy: (options: CustomStudyOptions, title: string) => boolean
}

export function Home({ onNavigate, onStudy, onCustomStudy }: HomeProps) {
  const { data } = useStore()
  const { t } = useI18n()
  const now = Date.now()
  const overall = overallStat(data.cards, now)
  const queue = buildStudyQueue(
    data.cards,
    data.decks,
    'all',
    data.history,
    data.settings,
    now,
  )
  const due = queue.filter((item) => !item.isNew).length
  const newCount = queue.filter((item) => item.isNew).length
  const today = todayStat(data, now)
  const goal = dailyGoalProgress(today, data.settings)
  const goalComplete = goal.goal > 0 && goal.done >= goal.goal
  const days = streak(data.history, now, data.settings.dayStartHour)
  const goalRadius = 40
  const goalCircumference = 2 * Math.PI * goalRadius
  const goalOffset = goalCircumference * (1 - goal.percent / 100)

  const ready = queue.length
  const canPractice = overall.learned > 0

  const ctaLabel =
    ready > 0 ? t('home.cta.studyAll') : canPractice ? t('home.cta.practice') : t('home.cta.chooseDeck')
  const ctaAction = () => {
    if (ready > 0 || canPractice) onStudy('all')
    else onNavigate({ name: 'decks' })
  }

  const subline =
    overall.total === 0
      ? t('home.sub.empty')
      : ready > 0
        ? `${due > 0 ? t('home.sub.due', { n: due }) : t('home.sub.noDue')} · ${
            newCount > 0 ? t('home.sub.newLeft', { n: newCount }) : t('home.sub.newDone')
          }`
        : t('home.sub.done')

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            {t('home.dateToday', {
              date: formatDate(now, data.settings.dayStartHour),
            })}
          </div>
          <h1>{greeting(now)}</h1>
          <p className="hero-sub">{subline}</p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={ctaAction}>
              {ctaLabel}
              <Icon name="arrow-right" size={18} />
            </button>
          </div>

          <button
            type="button"
            className={`hero-goal${goalComplete ? ' is-complete' : ''}`}
            onClick={() => onNavigate({ name: 'stats' })}
            aria-label={t('home.goalAria', {
              done: goal.done,
              goal: goal.goal,
            })}
          >
            <span className="hero-goal-ring" aria-hidden="true">
              <svg viewBox="0 0 100 100">
                <circle className="goal-ring-track" cx="50" cy="50" r={goalRadius} />
                <circle
                  className="goal-ring-value"
                  cx="50"
                  cy="50"
                  r={goalRadius}
                  strokeDasharray={goalCircumference}
                  strokeDashoffset={goalOffset}
                />
              </svg>
              <span className="hero-goal-percent">{goal.percent}%</span>
            </span>
            <span className="hero-goal-copy">
              <strong>
                {goalComplete && <Icon name="sparkles" size={13} />}
                {t('stats.dailyGoalProgress', { done: goal.done, goal: goal.goal })}
              </strong>
              <span>
                {t('common.today')} ·{' '}
                {goal.unit === 'minutes'
                  ? t('stats.dailyGoalUnitMinutes')
                  : t('stats.dailyGoalUnitReviews')}
              </span>
            </span>
            <Icon name="chevron-right" size={15} />
          </button>

          <div className="hero-meta">
            <span>
              <Icon name="flame" size={15} />
              {days > 0 ? t('home.streak', { n: days }) : t('home.streakEmpty')}
            </span>
            <span>
              <Icon name="check" size={15} />
              {today.reviews > 0
                ? t('home.reviewsToday', { n: today.reviews })
                : t('home.noReviews')}
            </span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="enso" />
          <div className="hero-jp">今日も一歩ずつ</div>
          <div className="hero-kanji">言葉</div>
        </div>
      </section>

      <CustomStudy onStart={onCustomStudy} />
    </div>
  )
}
