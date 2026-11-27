import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { Icon } from '../components/Icon'
import { TextForm } from '../components/TextForm'
import { TextReader } from '../components/TextReader'

function textPreview(body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim()
  return compact.length > 240 ? `${compact.slice(0, 240)}…` : compact
}

export function Texts() {
  const { data } = useStore()
  const { t, locale } = useI18n()
  const [creating, setCreating] = useState(false)
  const [openTextId, setOpenTextId] = useState<string | null>(null)

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale.intl, { dateStyle: 'medium' }),
    [locale.intl],
  )
  const texts = useMemo(
    () => [...data.texts].sort((a, b) => b.createdAt - a.createdAt),
    [data.texts],
  )
  const openText = openTextId
    ? data.texts.find((text) => text.id === openTextId)
    : undefined

  if (openText) {
    return <TextReader text={openText} onBack={() => setOpenTextId(null)} />
  }

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

        <div className="texts-grid">
          {texts.map((text) => (
            <button
              key={text.id}
              type="button"
              className="text-card"
              onClick={() => setOpenTextId(text.id)}
            >
              <span className="text-card-head">
                <span className="text-card-icon" aria-hidden="true">
                  <Icon name="text" size={19} />
                </span>
                <span className="text-card-copy">
                  <span className="text-card-title">{text.title}</span>
                  <span className="text-card-date">
                    {t('texts.createdAt', {
                      date: dateFormat.format(text.createdAt),
                    })}
                  </span>
                </span>
              </span>
              <span className="text-card-preview">{textPreview(text.body)}</span>
            </button>
          ))}

          <button className="deck-new text-new" onClick={() => setCreating(true)}>
            <span className="deck-new-icon">
              <Icon name="plus" size={20} />
            </span>
            <strong>{t('texts.newCardTitle')}</strong>
            <span>{t('texts.newCardHint')}</span>
          </button>
        </div>
      </section>

      {creating && <TextForm onClose={() => setCreating(false)} />}
    </div>
  )
}
