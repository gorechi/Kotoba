import type { DailyGoalType } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'

interface OnboardingProps {
  onFinish: () => void
}

const GOAL_PRESETS: Record<DailyGoalType, number[]> = {
  reviews: [10, 20, 30, 50],
  minutes: [5, 15, 30, 60],
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const { data, setSettings } = useStore()
  const { t } = useI18n()

  const goalType = data.settings.dailyGoalType
  const goalValue =
    goalType === 'minutes' ? data.settings.dailyMinuteGoal : data.settings.dailyReviewGoal
  const goalPresets = GOAL_PRESETS[goalType]

  const setGoalType = (type: DailyGoalType) => {
    if (type !== goalType) setSettings({ dailyGoalType: type })
  }

  const setGoal = (value: number) => {
    if (goalType === 'minutes') setSettings({ dailyMinuteGoal: value })
    else setSettings({ dailyReviewGoal: value })
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <header className="onboarding-head">
          <div className="onboarding-brand">
            <span className="brand-mark">言</span>
            <span className="brand-name">{t('brand.name')}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => onFinish()}>
            {t('onboarding.skip')}
          </button>
        </header>

        <div className="onboarding-copy">
          <div className="eyebrow">{t('onboarding.eyebrow')}</div>
          <h1>{t('onboarding.goalTitle')}</h1>
          <p>{t('onboarding.goalText')}</p>
        </div>

        <div className="onboarding-body">
          <div className="onboarding-goal">
            <div className="segmented">
              <button
                type="button"
                className={goalType === 'reviews' ? 'active' : ''}
                onClick={() => setGoalType('reviews')}
              >
                {t('settings.dailyGoalReviews')}
              </button>
              <button
                type="button"
                className={goalType === 'minutes' ? 'active' : ''}
                onClick={() => setGoalType('minutes')}
              >
                {t('settings.dailyGoalMinutes')}
              </button>
            </div>

            <div className="onboarding-presets">
              {goalPresets.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`onboarding-preset${goalValue === value ? ' active' : ''}`}
                  onClick={() => setGoal(value)}
                  aria-pressed={goalValue === value}
                >
                  <strong>{value}</strong>
                  <span>
                    {goalType === 'minutes'
                      ? t('onboarding.goalMinutes')
                      : t('onboarding.goalReviews')}
                  </span>
                </button>
              ))}
            </div>

            <p className="hint">{t('onboarding.goalHint')}</p>
          </div>
        </div>

        <footer className="onboarding-foot onboarding-foot--end">
          <button type="button" className="btn btn-primary" onClick={() => onFinish()}>
            {t('onboarding.finish')}
          </button>
        </footer>
      </div>
    </div>
  )
}
