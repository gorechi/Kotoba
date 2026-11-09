import { useEffect, useRef, useState } from 'react'
import type { Theme } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { normalizeData } from '../lib/normalize'
import { Icon, type IconName } from '../components/Icon'
import { ConfirmDialog } from '../components/Modal'
import { Select } from '../components/Select'

const THEMES: { value: Theme; labelKey: string; icon: IconName }[] = [
  { value: 'light', labelKey: 'settings.themeLight', icon: 'sun' },
  { value: 'dark', labelKey: 'settings.themeDark', icon: 'moon' },
  { value: 'system', labelKey: 'settings.themeSystem', icon: 'monitor' },
]

interface PendingImport {
  raw: unknown
  name: string
}

export function Settings() {
  const { data, setSettings, resetProgress, replaceData } = useStore()
  const { t, locales, language, setLanguage } = useI18n()
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 7000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const preview = pendingImport ? normalizeData(pendingImport.raw) : null

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

  const handleExport = async () => {
    setError(null)
    if (window.kotoba) {
      const path = await window.kotoba.exportData(data, t('settings.exportDialogTitle'))
      if (path) setNotice(t('settings.noticeBackupSaved', { path }))
      return
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'kotoba-backup.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice(t('settings.noticeBackupDownloaded'))
  }

  const handleImport = async () => {
    setError(null)
    if (window.kotoba) {
      const result = await window.kotoba.importData(t('settings.importDialogTitle'))
      if (!result) return
      if (result.error) {
        setError(t('settings.noticeImportReadError'))
        return
      }
      setPendingImport({
        raw: result.data,
        name: result.path?.split(/[\\/]/).pop() ?? t('common.file'),
      })
      return
    }
    fileRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      setPendingImport({ raw, name: file.name })
    } catch {
      setError(t('settings.noticeImportBadFile'))
    }
  }

  const openFolder = async () => {
    const folder = await window.kotoba?.openDataFolder()
    if (folder) setNotice(t('settings.noticeFolder', { path: folder }))
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

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>
                {t('settings.language')}
                {language !== 'en' && (
                  <span className="panel-title-note">
                    {' '}
                    ({t('settings.languageHint')})
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
              <h2>{t('settings.data')}</h2>
              <p>{t('settings.dataSub')}</p>
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn btn-ghost" onClick={() => void handleExport()}>
              <Icon name="download" size={17} />
              {t('settings.export')}
            </button>
            <button className="btn btn-ghost" onClick={() => void handleImport()}>
              <Icon name="upload" size={17} />
              {t('settings.import')}
            </button>
            {window.kotoba && (
              <button className="btn btn-ghost" onClick={() => void openFolder()}>
                <Icon name="folder" size={17} />
                {t('settings.dataFolder')}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                void handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>

          {notice && (
            <p className="notice">
              <Icon name="check" size={15} />
              <span>{notice}</span>
            </p>
          )}
          {error && <p className="form-error">{error}</p>}

          <p className="hint">{t('settings.dataHint')}</p>
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

        <section className="panel danger-panel">
          <div className="panel-head">
            <div>
              <h2>{t('settings.reset')}</h2>
              <p>{t('settings.resetSub')}</p>
            </div>
            <button className="btn btn-danger-ghost" onClick={() => setConfirmReset(true)}>
              <Icon name="rotate" size={17} />
              {t('settings.resetProgress')}
            </button>
          </div>
          <p className="hint">{t('settings.resetHint')}</p>
        </section>
      </div>

      <footer className="about">
        <span className="brand-mark small">言</span>
        <div>
          <strong>{t('brand.name')} · 言葉</strong>
          <span>{t('settings.about', { version: '1.3.0' })}</span>
        </div>
      </footer>

      {confirmReset && (
        <ConfirmDialog
          title={t('settings.resetTitle')}
          text={t('settings.resetText')}
          confirmLabel={t('settings.resetConfirm')}
          danger
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            resetProgress()
            setNotice(t('settings.noticeResetDone'))
          }}
        />
      )}

      {pendingImport && preview && (
        <ConfirmDialog
          title={t('settings.importTitle')}
          text={t('settings.importText', {
            name: pendingImport.name,
            cards: preview.cards.length,
            decks: preview.decks.length,
          })}
          confirmLabel={t('settings.importConfirm')}
          danger
          onClose={() => setPendingImport(null)}
          onConfirm={() => {
            replaceData(pendingImport.raw)
            setNotice(t('settings.noticeImported'))
          }}
        />
      )}
    </div>
  )
}
