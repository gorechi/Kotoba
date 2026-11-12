import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import {
  createDeckTransfer,
  importDeckTransfer,
  parseDeckTransfer,
  type ParsedDeckTransfer,
} from '../lib/deck-transfer'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { Select } from './Select'

/** Экспорт одной колоды в JSON и импорт её как новой колоды. */
export function DeckTransferPanel() {
  const { data, update } = useStore()
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedDeckId, setSelectedDeckId] = useState('')
  const [pending, setPending] = useState<ParsedDeckTransfer | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const decks = useMemo(
    () =>
      [...data.decks].sort(
        (a, b) => Number(b.builtin) - Number(a.builtin) || a.createdAt - b.createdAt,
      ),
    [data.decks],
  )

  useEffect(() => {
    if (decks.some((deck) => deck.id === selectedDeckId)) return
    setSelectedDeckId(decks[0]?.id ?? '')
  }, [decks, selectedDeckId])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId)
  const selectedCards = selectedDeck
    ? data.cards.filter((card) => card.deckId === selectedDeck.id)
    : []

  const exportDeck = async () => {
    if (!selectedDeck) return
    setError(null)
    setNotice(null)
    const title = deckTitle(selectedDeck, t)
    const payload = createDeckTransfer(selectedDeck, selectedCards, title)
    const safeTitle = title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'deck'

    if (window.kotoba?.exportData) {
      const path = await window.kotoba.exportData(
        payload,
        t('deckTransfer.exportDialog'),
        `${safeTitle}.kotoba-deck.json`,
      )
      if (path) setNotice(t('deckTransfer.noticeExported', { path }))
      return
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeTitle}.kotoba-deck.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice(t('deckTransfer.noticeDownloaded'))
  }

  const acceptFile = (raw: unknown) => {
    const parsed = parseDeckTransfer(raw)
    if (!parsed) {
      setError(t('deckTransfer.importInvalid'))
      return
    }
    setError(null)
    setNotice(null)
    setPending(parsed)
  }

  const importDeck = async () => {
    setError(null)
    setNotice(null)
    if (window.kotoba?.importData) {
      const result = await window.kotoba.importData(t('deckTransfer.importDialog'))
      if (!result) return
      if (result.error || result.data === undefined) {
        setError(t('deckTransfer.importInvalid'))
        return
      }
      acceptFile(result.data)
      return
    }
    fileRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      acceptFile(JSON.parse(await file.text()))
    } catch {
      setError(t('deckTransfer.importInvalid'))
    }
  }

  const confirmImport = () => {
    if (!pending || busy) return
    setBusy(true)
    try {
      const result = importDeckTransfer(
        data,
        pending,
        data.decks.map((deck) => deckTitle(deck, t)),
      )
      update(() => result.data)
      setNotice(t('deckTransfer.noticeImported', { name: pending.deck.name }))
      setPending(null)
    } catch {
      setError(t('deckTransfer.importInvalid'))
    } finally {
      setBusy(false)
    }
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

      <section className="panel deck-transfer-panel">
        <div className="panel-head">
          <div>
            <h2>{t('deckTransfer.title')}</h2>
            <p>{t('deckTransfer.subtitle')}</p>
          </div>
        </div>

        <div className="deck-transfer-grid">
          <div className="deck-transfer-block">
            <strong>{t('deckTransfer.exportTitle')}</strong>
            <p className="hint">{t('deckTransfer.exportSub')}</p>
            <div className="deck-transfer-controls">
              <Select
                value={selectedDeckId}
                aria-label={t('deckTransfer.exportSelect')}
                onChange={(event) => setSelectedDeckId(event.target.value)}
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deckTitle(deck, t)}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void exportDeck()}
                disabled={!selectedDeck}
              >
                <Icon name="download" size={16} />
                {t('deckTransfer.export')}
              </button>
            </div>
            {selectedDeck && (
              <p className="hint">
                {t('deckTransfer.exportCount', {
                  n: selectedCards.length,
                })}
              </p>
            )}
          </div>

          <div className="deck-transfer-block">
            <strong>{t('deckTransfer.importTitle')}</strong>
            <p className="hint">{t('deckTransfer.importSub')}</p>
            <div className="deck-transfer-controls">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void importDeck()}
              >
                <Icon name="upload" size={16} />
                {t('deckTransfer.import')}
              </button>
            </div>
            <p className="hint">{t('deckTransfer.progressHint')}</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                void handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
        </div>
      </section>

      {pending && (
        <Modal
          title={t('deckTransfer.importPreviewTitle')}
          onClose={() => {
            if (!busy) setPending(null)
          }}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPending(null)}
                disabled={busy}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmImport}
                disabled={busy || pending.cards.length === 0}
              >
                {t('deckTransfer.importConfirm')}
              </button>
            </>
          }
        >
          <p className="modal-text">
            {t('deckTransfer.importPreview', {
              name: pending.deck.name,
              n: pending.cards.length,
            })}
          </p>
          <p className="hint">{t('deckTransfer.progressHint')}</p>
        </Modal>
      )}
    </>
  )
}
