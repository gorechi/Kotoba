import { useMemo, useState } from 'react'
import type { DailyGoalType } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { detectSystemLocale } from '../lib/i18n'
import { Icon, type IconName } from './Icon'

interface OnboardingProps {
  onFinish: (deckId?: string) => void
}

const GOAL_PRESETS: Record<DailyGoalType, number[]> = {
  reviews: [10, 20, 30, 50],
  minutes: [5, 15, 30, 60],
}

const DECK_META: Record<string, { titleKey: string; textKey: string; icon: IconName }> = {
  hiragana: {
    titleKey: 'onboarding.deckHiragana',
    textKey: 'onboarding.deckHiraganaDesc',
    icon: 'kana',
  },
  katakana: {
    titleKey: 'onboarding.deckKatakana',
    textKey: 'onboarding.deckKatakanaDesc',
    icon: 'kana',
  },
  'kanji-n5': {
    titleKey: 'onboarding.deckKanji',
    textKey: 'onboarding.deckKanjiDesc',
    icon: 'kanji',
  },
}

export function Onboarding({ onFinish }: OnboardingProps) {
  const { data, setSettings } = useStore()
  const { t, locales, language, setLanguage } = useI18n()
  const [step, setStep] = useState(0)
  const [deckId, setDeckId] = useState('hiragana')
  const systemLocale = useMemo(() => detectSystemLocale(), [])

  const goalType = data.settings.dailyGoalType
  const goalValue =
    goalType === 'minutes' ? data.settings.dailyMinuteGoal : data.settings.dailyReviewGoal
  const goalPresets = GOAL_PRESETS[goalType]
  const decks = ['hiragana', 'katakana', 'kanji-n5'].filter((id) =>
    data.decks.some((deck) => deck.id === id),
  )

  const setGoalType = (type: DailyGoalType) => {
    if (type !== goalType) setSettings({ dailyGoalType: type })
  }

  const setGoal = (value: number) => {
    if (goalType === 'minutes') setSettings({ dailyMinuteGoal: value })
    else setSettings({ dailyReviewGoal: value })
  }

  const steps = [t('onboarding.languageTitle'), t('onboarding.goalTitle'), t('onboarding.deckTitle')]
  const last = step === steps.length - 1

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

        <div className="onboarding-progress" aria-hidden="true">
          {steps.map((label, index) => (
            <span
              key={label}
              className={`onboarding-dot${index === step ? ' active' : ''}${
                index < step ? ' done' : ''
              }`}
            />
          ))}
        </div>

        <div className="onboarding-copy">
          <div className="eyebrow">{t('onboarding.eyebrow')}</div>
          <h1>{steps[step]}</h1>
          <p>{t(`onboarding.${['language', 'goal', 'deck'][step]}Text`)}</p>
        </div>

        <div className="onboarding-body">
          {step === 0 && (
            <div className="onboarding-languages">
              {locales.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`onboarding-choice${language === item.code ? ' active' : ''}`}
                  onClick={() => setLanguage(item.code)}
                  aria-pressed={language === item.code}
                >
                  <span className="onboarding-choice-label">{item.name}</span>
                  {systemLocale === item.code && (
                    <span className="onboarding-choice-note">
                      {t('onboarding.systemLanguage')}
                    </span>
                  )}
                  {language === item.code && <Icon name="check" size={17} />}
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
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
          )}

          {step === 2 && (
            <div className="onboarding-decks">
              {decks.map((id) => {
                const meta = DECK_META[id]
                if (!meta) return null
                return (
                  <button
                    key={id}
                    type="button"
                    className={`onboarding-choice onboarding-deck${
                      deckId === id ? ' active' : ''
                    }`}
                    onClick={() => setDeckId(id)}
                    aria-pressed={deckId === id}
                  >
                    <span className="onboarding-deck-icon">
                      <Icon name={meta.icon} size={20} />
                    </span>
                    <span className="onboarding-choice-main">
                      <span className="onboarding-choice-label">{t(meta.titleKey)}</span>
                      <span className="onboarding-choice-note">{t(meta.textKey)}</span>
                    </span>
                    {deckId === id && <Icon name="check" size={17} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <footer className="onboarding-foot">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            {t('onboarding.back')}
          </button>
          <span className="onboarding-step">
            {t('onboarding.step', { n: step + 1, total: steps.length })}
          </span>
          {last ? (
            <button type="button" className="btn btn-primary" onClick={() => onFinish(deckId)}>
              {t('onboarding.finish')}
              <Icon name="arrow-right" size={17} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((value) => value + 1)}
            >
              {t('onboarding.next')}
              <Icon name="arrow-right" size={17} />
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
