import type { Theme } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { APP_VERSION } from '../lib/version'
import type { UpdateState } from '../lib/updates'
import { Icon, type IconName } from '../components/Icon'
import { Select } from '../components/Select'

const THEMES: { value: Theme; labelKey: string; icon: IconName }[] = [
  { value: 'light', labelKey: 'settings.themeLight', icon: 'sun' },
  { value: 'dark', labelKey: 'settings.themeDark', icon: 'moon' },
  { value: 'system', labelKey: 'settings.themeSystem', icon: 'monitor' },
]

interface SettingsProps {
  onZen: () => void
  update: UpdateState
  updateChecking: boolean
  onCheckUpdates: () => void
}

export function Settings({
  onZen,
  update,
  updateChecking,
  onCheckUpdates,
}: SettingsProps) {
  const { data, setSettings } = useStore()
  const { t, locales, language, setLanguage } = useI18n()

  const changeNewPerDay = (delta: number) => {
    setSettings({ newPerDay: Math.min(50, Math.max(1, data.settings.newPerDay + delta)) })
  }

  const dailyGoalValue =
    data.settings.dailyGoalType === 'minutes'
      ? data.settings.dailyMinuteGoal
      : data.settings.dailyReviewGoal

  const changeDailyGoal = (direction: -1 | 1) => {
    if (data.settings.dailyGoalType === 'minutes') {
      setSettings({
        dailyMinuteGoal: Math.min(
          180,
          Math.max(5, data.settings.dailyMinuteGoal + direction * 5),
        ),
      })
      return
    }
    setSettings({
      dailyReviewGoal: Math.min(
        200,
        Math.max(1, data.settings.dailyReviewGoal + direction),
      ),
    })
  }

  const bumpGoal = (
    key: 'goalReviews' | 'goalCards' | 'goalStreak',
    delta: number,
    min: number,
    max: number,
  ) => {
    const value = Math.min(max, Math.max(min, data.settings[key] + delta))
    if (key === 'goalReviews') setSettings({ goalReviews: value })
    else if (key === 'goalCards') setSettings({ goalCards: value })
    else setSettings({ goalStreak: value })
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('settings.eyebrow')}</div>
          <h1>{t('settings.title')}</h1>
          <p className="page-sub">{t('settings.subtitle')}</p>
        </div>
      </header>

      <div className="settings-grid">
        <section className="panel panel-wide update-panel">
          <div className="panel-head">
            <div>
              <h2>{t('settings.updates')}</h2>
              <p>{t('settings.updatesSub')}</p>
            </div>
            {update.status === 'available' && (
              <span className="update-badge">
                <Icon name="download" size={12} />
                {t('settings.updateAvailableBadge')}
              </span>
            )}
          </div>

          <div className="update-row">
            <div className="update-copy">
              {update.status === 'available' ? (
                <>
                  <strong>
                    {t('settings.updateAvailableTitle', {
                      version: update.latestVersion ?? '',
                    })}
                  </strong>
                  <span>
                    {t('settings.updateAvailableText', {
                      current: update.currentVersion,
                    })}
                  </span>
                </>
              ) : update.status === 'current' ? (
                <>
                  <strong>{t('settings.updateCurrentTitle')}</strong>
                  <span>
                    {t('settings.updateCurrentText', {
                      version: update.currentVersion,
                    })}
                  </span>
                </>
              ) : update.status === 'error' ? (
                <>
                  <strong>{t('settings.updateErrorTitle')}</strong>
                  <span>{t('settings.updateErrorText')}</span>
                </>
              ) : (
                <>
                  <strong>
                    {updateChecking
                      ? t('settings.updateChecking')
                      : t('settings.updateIdleTitle')}
                  </strong>
                  <span>{t('settings.updateIdleText')}</span>
                </>
              )}
            </div>

            <div className="update-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCheckUpdates}
                disabled={updateChecking}
              >
                <Icon name="rotate" size={16} />
                {updateChecking
                  ? t('settings.updateCheckingShort')
                  : t('settings.updateCheck')}
              </button>
              {update.status === 'available' && update.releaseUrl && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    window.open(update.releaseUrl, '_blank', 'noopener,noreferrer')
                  }
                >
                  <Icon name="download" size={16} />
                  {t('settings.updateDownload')}
                </button>
              )}
            </div>
          </div>

          {update.status === 'available' && (
            <p className="hint">{t('settings.updateHint')}</p>
          )}
        </section>

        <section className="panel panel-wide">
          <div className="panel-head">
            <div>
              <h2>{t('settings.goals')}</h2>
              <p>{t('settings.goalsSub')}</p>
            </div>
          </div>

          <div className="goal-type-row">
            <span className="goal-type-label">{t('settings.dailyGoal')}</span>
            <div className="segmented">
              <button
                className={data.settings.dailyGoalType === 'reviews' ? 'active' : ''}
                onClick={() => setSettings({ dailyGoalType: 'reviews' })}
              >
                {t('settings.dailyGoalReviews')}
              </button>
              <button
                className={data.settings.dailyGoalType === 'minutes' ? 'active' : ''}
                onClick={() => setSettings({ dailyGoalType: 'minutes' })}
              >
                {t('settings.dailyGoalMinutes')}
              </button>
            </div>
          </div>

          <div className="goal-row">
            <div className="goal-value">
              <strong>{dailyGoalValue}</strong>
              <span>
                {data.settings.dailyGoalType === 'minutes'
                  ? t('settings.minutesPerDay')
                  : t('settings.reviewsPerDay')}
              </span>
            </div>
            <div className="stepper">
              <button onClick={() => changeDailyGoal(-1)} aria-label={t('settings.lessAria')}>
                <Icon name="minus" size={16} />
              </button>
              <button onClick={() => changeDailyGoal(1)} aria-label={t('settings.moreAria')}>
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>

          <div className="goal-settings">
            <div className="goal-setting-row">
              <span>{t('settings.goalReviews')}</span>
              <div className="goal-setting-control">
                <strong>{data.settings.goalReviews}</strong>
                <div className="stepper small">
                  <button
                    onClick={() => bumpGoal('goalReviews', -100, 100, 1_000_000)}
                    aria-label={t('settings.lessAria')}
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <button
                    onClick={() => bumpGoal('goalReviews', 100, 100, 1_000_000)}
                    aria-label={t('settings.moreAria')}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="goal-setting-row">
              <span>{t('settings.goalCards')}</span>
              <div className="goal-setting-control">
                <strong>{data.settings.goalCards}</strong>
                <div className="stepper small">
                  <button
                    onClick={() => bumpGoal('goalCards', -10, 10, 100_000)}
                    aria-label={t('settings.lessAria')}
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <button
                    onClick={() => bumpGoal('goalCards', 10, 10, 100_000)}
                    aria-label={t('settings.moreAria')}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="goal-setting-row">
              <span>{t('settings.goalStreak')}</span>
              <div className="goal-setting-control">
                <strong>{data.settings.goalStreak}</strong>
                <div className="stepper small">
                  <button
                    onClick={() => bumpGoal('goalStreak', -1, 1, 10_000)}
                    aria-label={t('settings.lessAria')}
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <button
                    onClick={() => bumpGoal('goalStreak', 1, 1, 10_000)}
                    aria-label={t('settings.moreAria')}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="hint">{t('settings.goalsHint')}</p>
        </section>

        <section className="panel panel-wide">
          <div className="panel-head">
            <div>
              <h2>{t('settings.zen')}</h2>
              <p>{t('settings.zenSub')}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-small" onClick={onZen}>
              <Icon name="sparkles" size={15} />
              {t('settings.zenStart')}
            </button>
          </div>

          <div className="zen-settings-row">
            <label className="settings-check">
              <input
                type="checkbox"
                checked={data.settings.zenAuto}
                onChange={(event) => setSettings({ zenAuto: event.target.checked })}
              />
              <span>{t('settings.zenAuto')}</span>
            </label>

            {data.settings.zenAuto && (
              <div className="zen-idle-control">
                <span>{t('settings.zenIdle')}</span>
                <strong>{data.settings.zenIdleMinutes}</strong>
                <div className="stepper small">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        zenIdleMinutes: Math.max(1, data.settings.zenIdleMinutes - 1),
                      })
                    }
                    aria-label={t('settings.lessAria')}
                  >
                    <Icon name="minus" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        zenIdleMinutes: Math.min(120, data.settings.zenIdleMinutes + 1),
                      })
                    }
                    aria-label={t('settings.moreAria')}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="hint">{t('settings.zenHint')}</p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>
                {t('settings.language')}
                {language !== 'en' && (
                  <span className="panel-title-note">
                    {' '}
                    {/* Always English: a wayfinding hint for users who don't know the current language. */}
                    (Language)
                  </span>
                )}
              </h2>
              <p>{t('settings.languageSub')}</p>
            </div>
          </div>
          <div className="field">
            <Select
              id="settings-language"
              aria-label={t('settings.languageAria')}
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {locales.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="settings-replay">
            <div>
              <strong>{t('settings.replayOnboarding')}</strong>
              <span>{t('settings.replayOnboardingHint')}</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => setSettings({ onboardingDone: false })}
            >
              <Icon name="sparkles" size={15} />
              {t('settings.replayOnboardingAction')}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t('settings.appearance')}</h2>
              <p>{t('settings.theme')}</p>
            </div>
          </div>
          <div className="segmented">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                className={data.settings.theme === theme.value ? 'active' : ''}
                onClick={() => setSettings({ theme: theme.value })}
              >
                <Icon name={theme.icon} size={16} />
                {t(theme.labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t('settings.pace')}</h2>
              <p>{t('settings.paceSub')}</p>
            </div>
          </div>

          <div className="goal-row">
            <div className="goal-value">
              <strong>{data.settings.newPerDay}</strong>
              <span>{t('settings.newPerDayUnit')}</span>
            </div>
            <div className="stepper">
              <button onClick={() => changeNewPerDay(-1)} aria-label={t('settings.lessAria')}>
                <Icon name="minus" size={16} />
              </button>
              <button onClick={() => changeNewPerDay(1)} aria-label={t('settings.moreAria')}>
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>

          <input
            className="range"
            type="range"
            min={1}
            max={50}
            value={data.settings.newPerDay}
            onChange={(event) => setSettings({ newPerDay: Number(event.target.value) })}
            aria-label={t('settings.newPerDayAria')}
          />
          <div className="range-scale">
            <span>1</span>
            <span>50</span>
          </div>
          <p className="hint">{t('settings.paceHint')}</p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t('settings.transcription')}</h2>
              <p>{t('settings.transcriptionSub')}</p>
            </div>
          </div>
          <div className="segmented">
            <button
              className={data.settings.defaultTranscription === 'romaji' ? 'active' : ''}
              onClick={() => setSettings({ defaultTranscription: 'romaji' })}
            >
              {t('settings.transcriptionRomaji')}
            </button>
            <button
              className={data.settings.defaultTranscription === 'cyrillic' ? 'active' : ''}
              onClick={() => setSettings({ defaultTranscription: 'cyrillic' })}
            >
              {t('settings.transcriptionCyrillic')}
            </button>
          </div>
          <p className="hint">{t('settings.transcriptionHint')}</p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t('settings.writingMode')}</h2>
              <p>{t('settings.writingModeSub')}</p>
            </div>
          </div>
          <div className="segmented">
            <button
              className={data.settings.writingDifficulty === 'normal' ? 'active' : ''}
              onClick={() => setSettings({ writingDifficulty: 'normal' })}
            >
              {t('settings.writingNormal')}
            </button>
            <button
              className={data.settings.writingDifficulty === 'hard' ? 'active' : ''}
              onClick={() => setSettings({ writingDifficulty: 'hard' })}
            >
              {t('settings.writingHard')}
            </button>
          </div>
          <p className="hint">{t('settings.writingModeHint')}</p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t('settings.shortcuts')}</h2>
              <p>{t('settings.shortcutsSub')}</p>
            </div>
          </div>
          <div className="shortcuts">
            <div>
              <kbd>{t('settings.keySpace')}</kbd>
              <span>{t('settings.shortcutFlip')}</span>
            </div>
            <div>
              <kbd>1</kbd>
              <span>{t('settings.shortcutAgain')}</span>
            </div>
            <div>
              <kbd>2</kbd>
              <span>{t('settings.shortcutHard')}</span>
            </div>
            <div>
              <kbd>3</kbd>
              <span>{t('settings.shortcutGood')}</span>
            </div>
            <div>
              <kbd>4</kbd>
              <span>{t('settings.shortcutEasy')}</span>
            </div>
            <div>
              <kbd>esc</kbd>
              <span>{t('settings.shortcutEscape')}</span>
            </div>
          </div>
        </section>
      </div>

      <footer className="about">
        <span className="brand-mark small">言</span>
        <div>
          <strong>{t('brand.name')} · 言葉</strong>
          <span>{t('settings.about', { version: APP_VERSION })}</span>
        </div>
      </footer>
    </div>
  )
}
