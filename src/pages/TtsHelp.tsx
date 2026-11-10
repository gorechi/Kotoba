import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { useI18n } from '../lib/i18n-react'
import { getJapaneseVoice, speakJa } from '../lib/tts'

const STEPS = [1, 2, 3, 4, 5, 6, 7] as const

export function TtsHelp({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()
  const [voiceName, setVoiceName] = useState<string | null | undefined>(undefined)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const checkVoice = async () => {
    setChecking(true)
    const voice = await getJapaneseVoice()
    setVoiceName(voice?.name ?? null)
    setChecking(false)
  }

  useEffect(() => {
    void checkVoice()
  }, [])

  const testVoice = async () => {
    setNotice(null)
    const result = await speakJa('こんにちは')
    if (result.ok) {
      setNotice(t('ttsHelp.testOk'))
      return
    }
    await checkVoice()
  }

  const openSettings = async () => {
    setNotice(null)
    if (!window.kotoba?.openSpeechSettings) {
      setNotice(t('ttsHelp.webHint'))
      return
    }
    const opened = await window.kotoba.openSpeechSettings()
    setNotice(opened ? t('ttsHelp.settingsOpened') : t('ttsHelp.settingsFailed'))
  }

  const found = Boolean(voiceName)
  const missing = voiceName === null
  const statusClass = found ? ' is-ok' : missing ? ' is-missing' : ''

  return (
    <div className="page tts-help-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('ttsHelp.eyebrow')}</div>
          <h1>{t('ttsHelp.title')}</h1>
          <p className="page-sub">{t('ttsHelp.subtitle')}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <Icon name="chevron-left" size={16} />
          {t('ttsHelp.back')}
        </button>
      </header>

      <div className={`tts-status${statusClass}`}>
        <span className="tts-status-icon">
          <Icon name={found ? 'check' : 'bulb'} size={18} />
        </span>
        <div className="tts-status-copy">
          <strong>
            {voiceName === undefined
              ? t('ttsHelp.statusChecking')
              : found
                ? t('ttsHelp.statusFound', { name: voiceName ?? '' })
                : t('ttsHelp.statusMissing')}
          </strong>
          {voiceName !== undefined && (
            <span>{missing ? t('ttsHelp.statusHintMissing') : t('ttsHelp.statusHintFound')}</span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => void checkVoice()}
          disabled={checking}
        >
          <Icon name="rotate" size={14} />
          {t('ttsHelp.checkAgain')}
        </button>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t('ttsHelp.stepsTitle')}</h2>
            <p>{t('ttsHelp.stepsSub')}</p>
          </div>
        </div>

        <ol className="tts-steps">
          {STEPS.map((step) => (
            <li key={step}>
              <span className="tts-step-num">{step}</span>
              <div>
                <strong>{t(`ttsHelp.step${step}Title`)}</strong>
                <p>{t(`ttsHelp.step${step}`)}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="tts-help-actions">
          <button type="button" className="btn btn-primary" onClick={() => void openSettings()}>
            <Icon name="sliders" size={16} />
            {t('ttsHelp.openSettings')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void testVoice()}
            disabled={!found}
          >
            <Icon name="speaker" size={16} />
            {t('ttsHelp.test')}
          </button>
        </div>

        {notice && (
          <p className="notice">
            <Icon name="bulb" size={15} />
            <span>{notice}</span>
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t('ttsHelp.noteTitle')}</h2>
          </div>
        </div>
        <p className="tts-help-note-text">{t('ttsHelp.note')}</p>
      </section>
    </div>
  )
}
