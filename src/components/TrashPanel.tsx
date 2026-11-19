import { useEffect, useState } from 'react'
import type { TrashEntry } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import {
  emptyTrash,
  removeTrashEntry,
  restoreTrashEntry,
} from '../lib/trash'
import { ConfirmDialog } from './Modal'
import { Icon } from './Icon'

type PendingConfirm = { kind: 'all' } | { kind: 'entry'; entry: TrashEntry }

export function TrashPanel() {
  const { data, update } = useStore()
  const { t, locale } = useI18n()
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const entries = [...data.trash].sort((a, b) => b.deletedAt - a.deletedAt)
  const retentionDays = data.settings.trashRetentionDays
  const deckMap = new Map(data.decks.map((deck) => [deck.id, deck]))
  const dateFormat = new Intl.DateTimeFormat(locale.intl, { dateStyle: 'medium' })

  const restore = (entry: TrashEntry) => {
    setError(null)
    const result = restoreTrashEntry(data, entry.id)
    if (!result.restored) {
      setError(t('trash.restoreError'))
      return
    }
    update(() => result.data)
    setNotice(
      entry.kind === 'deck' ? t('trash.restoredDeck') : t('trash.restoredCard'),
    )
  }

  const removeEntry = (entry: TrashEntry) => {
    update((current) => removeTrashEntry(current, entry.id))
    setNotice(t('trash.deletedForever'))
  }

  const clear = () => {
    update((current) => emptyTrash(current))
    setNotice(t('trash.cleared'))
  }

  const entryTitle = (entry: TrashEntry) => {
    if (entry.kind === 'deck') return deckTitle(entry.deck, t)
    return entry.card.front
  }

  const entrySubtitle = (entry: TrashEntry) => {
    if (entry.kind === 'deck') return t('count.cards', { n: entry.cards.length })
    const deck = deckMap.get(entry.card.deckId)
    return deck
      ? t('trash.cardInDeck', { deck: deckTitle(deck, t) })
      : t('trash.unknownDeck')
  }

  return (
    <>
      {(notice || error) && (
        <div className="backup-notices">
          {notice && (
            <p className="notice">
              <Icon name="check" size={15} />
              <span>{notice}</span>
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t('trash.title')}</h2>
            <p>{t('trash.subtitle')}</p>
          </div>
          <div className="settings-actions">
            {entries.length > 0 && (
              <span className="badge badge-soft">
                {t('trash.items', { n: entries.length })}
              </span>
            )}
            <button
              type="button"
              className="btn btn-danger-ghost btn-small"
              onClick={() => setConfirm({ kind: 'all' })}
              disabled={entries.length === 0}
            >
              <Icon name="trash" size={15} />
              {t('trash.clear')}
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="empty-note">{t('trash.empty')}</p>
        ) : (
          <ul className="trash-list">
            {entries.map((entry) => (
              <li key={`${entry.kind}-${entry.id}`} className="trash-item">
                <div className="trash-item-main">
                  <div className="trash-item-title">
                    <span className="trash-item-kind" aria-hidden="true">
                      <Icon name={entry.kind === 'deck' ? 'layers' : 'book'} size={15} />
                    </span>
                    <strong>{entryTitle(entry)}</strong>
                    {entry.kind === 'card' && entry.card.reading.trim() && (
                      <span className="trash-item-reading">{entry.card.reading}</span>
                    )}
                  </div>
                  <div className="trash-item-meta">
                    <span>{entrySubtitle(entry)}</span>
                    <span>
                      {t('trash.deletedAt', {
                        date: dateFormat.format(entry.deletedAt),
                      })}
                    </span>
                  </div>
                </div>
                <div className="trash-item-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => restore(entry)}
                  >
                    <Icon name="rotate" size={15} />
                    {t('trash.restore')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-small"
                    onClick={() => setConfirm({ kind: 'entry', entry })}
                    aria-label={t('trash.delete')}
                    title={t('trash.delete')}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="hint">
          {retentionDays > 0
            ? t('trash.hint', { n: retentionDays })
            : t('trash.hintNever')}
        </p>
      </section>

      {confirm?.kind === 'all' && (
        <ConfirmDialog
          title={t('trash.clearTitle')}
          text={t('trash.clearText')}
          confirmLabel={t('trash.clearConfirm')}
          danger
          onClose={() => setConfirm(null)}
          onConfirm={clear}
        />
      )}

      {confirm?.kind === 'entry' && (
        <ConfirmDialog
          title={t('trash.deleteTitle')}
          text={t('trash.deleteText')}
          confirmLabel={t('trash.delete')}
          danger
          onClose={() => setConfirm(null)}
          onConfirm={() => removeEntry(confirm.entry)}
        />
      )}
    </>
  )
}
