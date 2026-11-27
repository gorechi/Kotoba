import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { addText } from '../lib/texts'
import { Icon } from './Icon'
import { Modal } from './Modal'

interface TextFormProps {
  onClose: () => void
}

export function TextForm({ onClose }: TextFormProps) {
  const { update, trackWork } = useStore()
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

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
    onClose()
  }

  return (
    <Modal
      title={t('texts.formTitle')}
      subtitle={t('texts.formSubtitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" form="text-form" className="btn btn-primary">
            {t('texts.add')}
          </button>
        </>
      }
    >
      <form id="text-form" className="form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}

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
            autoFocus
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
        </div>
      </form>
    </Modal>
  )
}
