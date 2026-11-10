import { Icon } from '../components/Icon'
import { useI18n } from '../lib/i18n-react'

export function Help({ onOpenTtsHelp }: { onOpenTtsHelp: () => void }) {
  const { t } = useI18n()

  return (
    <div className="page help-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('help.eyebrow')}</div>
          <h1>{t('help.title')}</h1>
          <p className="page-sub">{t('help.subtitle')}</p>
        </div>
      </header>

      <section className="help-section">
        <h2>{t('help.sectionSystem')}</h2>
        <div className="help-list">
          <button type="button" className="help-item" onClick={onOpenTtsHelp}>
            <span className="help-item-icon">
              <Icon name="speaker" size={19} />
            </span>
            <span className="help-item-copy">
              <strong>{t('help.ttsTitle')}</strong>
              <span>{t('help.ttsDesc')}</span>
            </span>
            <Icon name="chevron-right" size={17} />
          </button>
        </div>
      </section>

      <section className="help-section">
        <h2>{t('help.sectionLearning')}</h2>
        <p className="help-empty">{t('help.learningEmpty')}</p>
      </section>
    </div>
  )
}
