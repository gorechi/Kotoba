import { useState } from 'react'
import type { Deck } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle, isProtectedDeck } from '../lib/content'
import { mergeDecks } from '../lib/deck-ops'
import { Modal } from './Modal'
import { Select } from './Select'

interface MergeDecksDialogProps {
  source: Deck
  onClose: () => void
  onMerged: (targetId: string) => void
}

/** Объединение колоды с другой колодой того же типа. */
export function MergeDecksDialog({ source, onClose, onMerged }: MergeDecksDialogProps) {
  const { data, update } = useStore()
  const { t } = useI18n()

  const targets = data.decks.filter(
    (deck) =>
      deck.id !== source.id && deck.kind === source.kind && !isProtectedDeck(deck),
  )
  const [targetId, setTargetId] = useState(() => targets[0]?.id ?? '')
  const cardCount = data.cards.filter((card) => card.deckId === source.id).length
  const canMerge = Boolean(targetId) && targets.length > 0

  const merge = () => {
    if (!canMerge) return
    const result = mergeDecks(data, source.id, targetId)
    if (!result.merged) return
    update(() => result.data)
    onMerged(targetId)
    onClose()
  }

  return (
    <Modal
      title={t('deckMerge.title')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={merge}
            disabled={!canMerge}
          >
            {t('deckMerge.confirm')}
          </button>
        </>
      }
    >
      <p className="modal-text">
        {t('deckMerge.subtitle', { name: deckTitle(source, t) })}
      </p>

      {targets.length === 0 ? (
        <p className="form-error">{t('deckMerge.noTargets')}</p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="merge-target">{t('deckMerge.target')}</label>
            <Select
              id="merge-target"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
            >
              {targets.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deckTitle(deck, t)}
                </option>
              ))}
            </Select>
          </div>

          <p className="hint">
            {t('deckMerge.hint', {
              name: deckTitle(source, t),
              n: cardCount,
            })}
          </p>
        </>
      )}
    </Modal>
  )
}
