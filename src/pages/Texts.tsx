import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { addText } from '../lib/texts'
import { Icon } from '../components/Icon'

function textPreview(body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim()
  return compact.length > 240 ? `${compact.slice(0, 240)}…` : compact
}

export function Texts() {
  const { data, update, trackWork } = useStore()
  const { t, locale } = useI18n()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale.intl, { dateStyle: 'medium' }),
    [locale.intl],
  )
  const texts = useMemo(
    () => [...data.texts].sort((a, b) => b.createdAt - a.createdAt),
    [data.texts],
  )

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!/\.txt$/i.test(file.name)) {
      setError(t('texts.fileTypeError'))
      return
    }
    try {
      const text = await file.text()
      setBody(text)
      if (!title.trim()) setTitle(file.name.replace(/\.txt$/i, '').trim())
      setError(null)
      setNotice(null)
    } catch {
      setError(t('texts.fileReadError'))
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError(t('texts.nameError'))
      return
    }
    if (!body.trim()) {
      setError(t('texts.bodyError'))
      return
    }
    update((current) => addText(current, cleanTitle, body))
    trackWork()
    setTitle('')
    setBody('')
    setError(null)
    setNotice(t('texts.added'))
  }

  return (
    <div className="page texts-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('texts.eyebrow')}</div>
          <h1>{t('texts.title')}</h1>
          <p className="page-sub">{t('texts.subtitle')}</p>
        </div>
      </header>

      <section className="panel text-form-panel">
        <div className="panel-head">
          <div>
            <h2>{t('texts.formTitle')}</h2>
            <p>{t('texts.formSubtitle')}</p>
          </div>
        </div>

        <form className="form" onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}
          {notice && (
            <p className="notice">
              <Icon name="check" size={15} />
              <span>{notice}</span>
            </p>
          )}

          <div className="field">
            <label htmlFor="text-title">{t('texts.nameLabel')}</label>
            <input
              id="text-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError(null)
              }}
              placeholder={t('texts.namePlaceholder')}
            />
          </div>

          <div className="field">
            <label htmlFor="text-body">{t('texts.bodyLabel')}</label>
            <textarea
              id="text-body"
              className="text-body-input"
              value={body}
              onChange={(event) => {
                setBody(event.target.value)
                setError(null)
              }}
              placeholder={t('texts.bodyPlaceholder')}
              rows={9}
            />
          </div>

          <div className="text-form-actions">
            <label className="btn btn-ghost btn-small text-file-button">
              <Icon name="upload" size={15} />
              {t('texts.file')}
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={(event) => void readFile(event)}
                aria-label={t('texts.file')}
              />
            </label>
            <span className="text-file-hint">{t('texts.fileHint')}</span>
            <button type="submit" className="btn btn-primary">
              <Icon name="plus" size={16} />
              {t('texts.add')}
            </button>
          </div>
        </form>
      </section>

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
    </div>
  )
}
