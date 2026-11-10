import { HELP_GUIDES, helpText, type HelpGuide } from '../data/help-guides'
import { Icon, type IconName } from '../components/Icon'
import { useI18n } from '../lib/i18n-react'

interface GuideCardProps {
  icon: IconName
  title: string
  description: string
  meta?: string
  onClick: () => void
}

function GuideCard({ icon, title, description, meta, onClick }: GuideCardProps) {
  return (
    <button type="button" className="help-item" onClick={onClick}>
      <span className="help-item-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="help-item-copy">
        <strong>{title}</strong>
        <span>{description}</span>
        {meta && <span className="help-item-meta">{meta}</span>}
      </span>
      <Icon name="chevron-right" size={17} />
    </button>
  )
}

export function Help({
  onOpenTtsHelp,
  onOpenGuide,
}: {
  onOpenTtsHelp: () => void
  onOpenGuide: (guideId: string) => void
}) {
  const { t, language } = useI18n()
  const system = HELP_GUIDES.filter((guide) => guide.section === 'system')
  const learning = HELP_GUIDES.filter((guide) => guide.section === 'learning')

  const metaFor = (guide: HelpGuide) =>
    `${t('help.stepCount', { n: guide.steps.length })} · ${helpText(guide.time, language)}`

  return (
    <div className="page help-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('help.eyebrow')}</div>
          <h1>{t('help.title')}</h1>
          <p className="page-sub">{t('help.subtitle')}</p>
        </div>
      </header>

      <div className="help-overview">
        <span className="help-overview-icon">
          <Icon name="help" size={24} />
        </span>
        <div>
          <strong>{t('help.overviewTitle')}</strong>
          <span>{t('help.overviewText', { n: HELP_GUIDES.length + 1 })}</span>
        </div>
      </div>

      <section className="help-section">
        <div className="help-section-head">
          <h2>{t('help.sectionSystem')}</h2>
          <span>{t('help.sectionCount', { n: system.length + 1 })}</span>
        </div>
        <div className="help-list">
          <GuideCard
            icon="speaker"
            title={t('help.ttsTitle')}
            description={t('help.ttsDesc')}
            meta={t('help.ttsMeta')}
            onClick={onOpenTtsHelp}
          />
          {system.map((guide) => (
            <GuideCard
              key={guide.id}
              icon={guide.icon}
              title={helpText(guide.title, language)}
              description={helpText(guide.description, language)}
              meta={metaFor(guide)}
              onClick={() => onOpenGuide(guide.id)}
            />
          ))}
        </div>
      </section>

      <section className="help-section">
        <div className="help-section-head">
          <h2>{t('help.sectionLearning')}</h2>
          <span>{t('help.sectionCount', { n: learning.length })}</span>
        </div>
        <div className="help-list">
          {learning.map((guide) => (
            <GuideCard
              key={guide.id}
              icon={guide.icon}
              title={helpText(guide.title, language)}
              description={helpText(guide.description, language)}
              meta={metaFor(guide)}
              onClick={() => onOpenGuide(guide.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
