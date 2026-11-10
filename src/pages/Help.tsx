import { useState } from 'react'
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
  const [query, setQuery] = useState('')
  const search = query.trim().toLowerCase()

  const matches = (guide: HelpGuide) => {
    if (!search) return true
    const text = [
      helpText(guide.title, language),
      helpText(guide.description, language),
      helpText(guide.intro, language),
      ...guide.steps.flatMap((step) => [
        helpText(step.title, language),
        helpText(step.text, language),
        step.tip ? helpText(step.tip, language) : '',
      ]),
    ]
      .join(' ')
      .toLowerCase()
    return text.includes(search)
  }

  const ttsMatches =
    !search ||
    `${t('help.ttsTitle')} ${t('help.ttsDesc')}`.toLowerCase().includes(search)

  const system = HELP_GUIDES.filter((guide) => guide.section === 'system' && matches(guide))
  const learning = HELP_GUIDES.filter(
    (guide) => guide.section === 'learning' && matches(guide),
  )

  const metaFor = (guide: HelpGuide) =>
    `${t('help.stepCount', { n: guide.steps.length })} · ${helpText(guide.time, language)}`

  const nothingFound = !ttsMatches && system.length === 0 && learning.length === 0

  return (
    <div className="page help-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('help.eyebrow')}</div>
          <h1>{t('help.title')}</h1>
          <p className="page-sub">{t('help.subtitle')}</p>
        </div>
      </header>

      <div className="help-search">
        <Icon name="search" size={17} />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('help.searchPlaceholder')}
          aria-label={t('help.searchPlaceholder')}
        />
        {query && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => setQuery('')}
            aria-label={t('common.reset')}
            title={t('common.reset')}
          >
            <Icon name="x" size={15} />
          </button>
        )}
      </div>

      <div className="help-overview">
        <span className="help-overview-icon">
          <Icon name="help" size={24} />
        </span>
        <div>
          <strong>{t('help.overviewTitle')}</strong>
          <span>{t('help.overviewText', { n: HELP_GUIDES.length + 1 })}</span>
        </div>
      </div>

      {nothingFound && <p className="help-empty">{t('help.searchEmpty')}</p>}

      {(ttsMatches || system.length > 0) && (
        <section className="help-section">
          <div className="help-section-head">
            <h2>{t('help.sectionSystem')}</h2>
            <span>{t('help.sectionCount', { n: system.length + (ttsMatches ? 1 : 0) })}</span>
          </div>
          <div className="help-list">
            {ttsMatches && (
              <GuideCard
                icon="speaker"
                title={t('help.ttsTitle')}
                description={t('help.ttsDesc')}
                meta={t('help.ttsMeta')}
                onClick={onOpenTtsHelp}
              />
            )}
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
      )}

      {learning.length > 0 && (
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
      )}
    </div>
  )
}
