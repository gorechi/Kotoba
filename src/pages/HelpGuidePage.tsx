import type { Route } from '../types'
import { findHelpGuide, helpText } from '../data/help-guides'
import { useI18n } from '../lib/i18n-react'
import { Icon } from '../components/Icon'

interface HelpGuidePageProps {
  guideId: string
  onBack: () => void
  onNavigate: (route: Route) => void
}

export function HelpGuidePage({ guideId, onBack, onNavigate }: HelpGuidePageProps) {
  const { t, language } = useI18n()
  const guide = findHelpGuide(guideId)

  if (!guide) {
    return (
      <div className="page help-guide-page">
        <button className="back-btn" onClick={onBack}>
          <Icon name="chevron-left" size={16} /> {t('help.back')}
        </button>
        <p className="empty-note">{t('help.notFound')}</p>
      </div>
    )
  }

  const sectionLabel =
    guide.section === 'system' ? t('help.sectionSystem') : t('help.sectionLearning')

  return (
    <div className="page help-guide-page">
      <button className="back-btn" onClick={onBack}>
        <Icon name="chevron-left" size={16} /> {t('help.back')}
      </button>

      <header className="guide-hero">
        <span className={`guide-hero-icon guide-hero-icon--${guide.section}`}>
          <Icon name={guide.icon} size={30} />
        </span>
        <div className="guide-hero-copy">
          <div className="eyebrow">
            {sectionLabel} · {t('help.guideEyebrow')}
          </div>
          <h1>{helpText(guide.title, language)}</h1>
          <p className="page-sub">{helpText(guide.description, language)}</p>
          <div className="guide-meta">
            <span>
              <Icon name="layers" size={14} />
              {t('help.stepCount', { n: guide.steps.length })}
            </span>
            <span>
              <Icon name="calendar" size={14} />
              {helpText(guide.time, language)}
            </span>
          </div>
        </div>
      </header>

      <div className="guide-intro">
        <span className="guide-intro-icon">
          <Icon name="bulb" size={18} />
        </span>
        <p>{helpText(guide.intro, language)}</p>
      </div>

      <ol className="guide-steps">
        {guide.steps.map((step, index) => (
          <li className="guide-step" key={`${guide.id}-${index}`}>
            <span className="guide-step-num">{index + 1}</span>
            <div className="guide-step-body">
              <h2>{helpText(step.title, language)}</h2>
              <p>{helpText(step.text, language)}</p>
              {step.tip && (
                <div className="guide-tip">
                  <Icon name="bulb" size={14} />
                  <span>{helpText(step.tip, language)}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {guide.note && (
        <section className="guide-note">
          <div className="guide-note-head">
            <Icon name="bulb" size={17} />
            <h2>{helpText(guide.note.title, language)}</h2>
          </div>
          <p>{helpText(guide.note.text, language)}</p>
        </section>
      )}

      <footer className="guide-footer">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <Icon name="chevron-left" size={16} />
          {t('help.allGuides')}
        </button>
        {guide.target && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate(guide.target!.route)}
          >
            {helpText(guide.target.label, language)}
            <Icon name="arrow-right" size={16} />
          </button>
        )}
      </footer>
    </div>
  )
}
