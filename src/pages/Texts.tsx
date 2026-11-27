import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { Icon } from '../components/Icon'
import { TextForm } from '../components/TextForm'

function textPreview(body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim()
  return compact.length > 240 ? `${compact.slice(0, 240)}…` : compact
}

export function Texts() {
  const { data } = useStore()
  const { t, locale } = useI18n()
  const [creating, setCreating] = useState(false)

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale.intl, { dateStyle: 'medium' }),
    [locale.intl],
  )
  const texts = useMemo(
    () => [...data.texts].sort((a, b) => b.createdAt - a.createdAt),
    [data.texts],
  )

  return (
    <div className="page texts-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('texts.eyebrow')}</div>
          <h1>{t('texts.title')}</h1>
          <p className="page-sub">{t('texts.subtitle')}</p>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} />
            {t('texts.new')}
          </button>
        </div>
      </header>

      <section className="texts-library">
        <div className="texts-list-head">
          <h2>{t('texts.listTitle')}</h2>
        </div>

        {texts.length === 0 ? (
          <p className="empty-note">{t('texts.empty')}</p>
        ) : (
          <div className="texts-grid">
            {texts.map((text) => (
              <article key={text.id} className="text-card">
                <div className="text-card-head">
                  <span className="text-card-icon" aria-hidden="true">
                    <Icon name="text" size={19} />
                  </span>
                  <div className="text-card-copy">
                    <h3>{text.title}</h3>
                    <span>
                      {t('texts.createdAt', {
                        date: dateFormat.format(text.createdAt),
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-card-preview">{textPreview(text.body)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {creating && <TextForm onClose={() => setCreating(false)} />}
    </div>
  )
}
