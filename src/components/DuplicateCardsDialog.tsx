import { useState } from 'react'
import type { Card } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { cardMeaning, deckTitle, isProtectedDeck } from '../lib/content'
import { trashCards } from '../lib/trash'
import { ConfirmDialog, Modal } from './Modal'
import { CardPreview } from './CardPreview'
import { Icon } from './Icon'

interface DuplicateCardsDialogProps {
  cards: Card[]
  onIgnore: () => void
  onCancel: () => void
}

export function DuplicateCardsDialog({
  cards,
  onIgnore,
  onCancel,
}: DuplicateCardsDialogProps) {
  const { data, update } = useStore()
  const { t } = useI18n()
  const [items, setItems] = useState(cards)
  const [preview, setPreview] = useState<Card | null>(null)
  const [deleting, setDeleting] = useState<Card | null>(null)

  const deckOf = (card: Card) => data.decks.find((deck) => deck.id === card.deckId)
  const protectedCard = (card: Card) => {
    const deck = deckOf(card)
    return deck ? isProtectedDeck(deck) : false
  }

  const removeDuplicate = (card: Card) => {
    update((current) => trashCards(current, [card.id]))
    setItems((current) => current.filter((item) => item.id !== card.id))
    if (preview?.id === card.id) setPreview(null)
  }

  return (
    <Modal
      title={t('duplicates.title')}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t('duplicates.cancel')}
          </button>
          <button type="button" className="btn btn-primary" onClick={onIgnore}>
            {t('duplicates.ignore')}
          </button>
        </>
      }
    >
      <p className="modal-text">{t('duplicates.askText')}</p>

      <div className="duplicate-list">
        {items.length === 0 && <p className="hint">{t('duplicates.empty')}</p>}
        {items.map((card) => {
          const deck = deckOf(card)
          const isProtected = protectedCard(card)
          return (
            <div className="duplicate-item" key={card.id}>
              <div className="duplicate-item-main">
                <strong className="duplicate-item-front">{card.front}</strong>
                <span className="duplicate-item-meaning">
                  {cardMeaning(card, t) || t('browser.noValue')}
                </span>
                <span className="duplicate-item-deck">
                  {t('duplicates.deck', {
                    name: deck ? deckTitle(deck, t) : t('common.untitled'),
                  })}
                </span>
              </div>
              <div className="duplicate-item-actions">
                <button
                  type="button"
                  className="icon-btn"
                  title={t('browser.preview')}
                  aria-label={`${t('browser.preview')}: ${card.front}`}
                  onClick={() => setPreview(card)}
                >
                  <Icon name="eye" size={16} />
                </button>
                {!isProtected && (
                  <button
                    type="button"
                    className="icon-btn danger"
                    title={t('duplicates.deleteTitle')}
                    aria-label={t('duplicates.deleteAria', { front: card.front })}
                    onClick={() => setDeleting(card)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {preview && (
        <CardPreview
          card={preview}
          deck={deckOf(preview)}
          onClose={() => setPreview(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t('duplicates.deleteTitle')}
          text={t('duplicates.deleteText', { front: deleting.front })}
          confirmLabel={t('duplicates.deleteAction')}
          danger
          onClose={() => setDeleting(null)}
          onConfirm={() => removeDuplicate(deleting)}
        />
      )}
    </Modal>
  )
}

interface DuplicateDenyDialogProps {
  onClose: () => void
}

export function DuplicateDenyDialog({ onClose }: DuplicateDenyDialogProps) {
  const { t } = useI18n()
  return (
    <Modal
      title={t('duplicates.denyTitle')}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          {t('duplicates.ok')}
        </button>
      }
    >
      <p className="modal-text">{t('duplicates.denyText')}</p>
    </Modal>
  )
}
