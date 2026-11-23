import type { Card, Deck } from '../types'
import { useI18n } from '../lib/i18n-react'
import { cardExampleTranslation, cardMeaning, cardSpeakText, deckTitle } from '../lib/content'
import { STATUS_LABEL_KEY, cardStatus } from '../lib/card-browser'
import { dueLabel, formatDate } from '../lib/utils'
import { speakJa } from '../lib/tts'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { SpeakButton } from './SpeakButton'

interface CardPreviewProps {
  card: Card
  deck?: Deck
  onClose: () => void
}

/** Модалка просмотра карточки — общая для «Карточек» и экрана колоды. */
export function CardPreview({ card, deck, onClose }: CardPreviewProps) {
  const { t } = useI18n()
  const now = Date.now()

  return (
    <Modal
      title={t('browser.previewTitle')}
      subtitle={deck ? deckTitle(deck, t) : undefined}
      onClose={onClose}
      footer={
        <button className="btn btn-ghost" onClick={onClose}>
          {t('common.close')}
        </button>
      }
    >
      <div className="browser-preview">
        <div className="browser-preview-front">
          <span className="kana-char">{card.front}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => speakJa(cardSpeakText(card))}
            aria-label={t('session.listen')}
            title={t('session.listen')}
          >
            <Icon name="speaker" size={17} />
          </button>
        </div>

        <div className="browser-preview-grid">
          <div>
            <span>{t('browser.reading')}</span>
            <strong>{card.reading || t('browser.noValue')}</strong>
          </div>
          <div>
            <span>{t('browser.meaning')}</span>
            <strong>{cardMeaning(card, t) || t('browser.noValue')}</strong>
          </div>
          <div>
            <span>{t('browser.status')}</span>
            <strong>{t(STATUS_LABEL_KEY[cardStatus(card, now)])}</strong>
          </div>
          <div>
            <span>{t('browser.interval')}</span>
            <strong>
              {card.srs.introduced
                ? `${Math.round(card.srs.interval)} ${t('browser.daysShort')}`
                : t('browser.noValue')}
            </strong>
          </div>
          <div>
            <span>{t('browser.due')}</span>
            <strong>{dueLabel(card.srs.due, card.srs.introduced)}</strong>
          </div>
          <div>
            <span>{t('browser.lapses')}</span>
            <strong>{card.srs.lapses}</strong>
          </div>
          <div>
            <span>{t('cardForm.jlpt')}</span>
            <strong>{card.jlpt ? `N${card.jlpt}` : t('browser.noValue')}</strong>
          </div>
          <div>
            <span>{t('cardForm.frequency')}</span>
            <strong>{card.frequency ?? t('browser.noValue')}</strong>
          </div>
          <div>
            <span>{t('browser.created')}</span>
            <strong>{formatDate(card.createdAt)}</strong>
          </div>
        </div>

        {card.note && (
          <div className="browser-preview-section">
            <span>{t('browser.note')}</span>
            <p>{card.note}</p>
          </div>
        )}
        {card.mnemonic && (
          <div className="browser-preview-section">
            <span>{t('browser.mnemonic')}</span>
            <p>{card.mnemonic}</p>
          </div>
        )}
        {card.tags.length > 0 && (
          <div className="browser-preview-section">
            <span>{t('browser.tags')}</span>
            <div className="browser-preview-tags">
              {card.tags.map((tag) => (
                <span className="tag-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {card.readings.length > 0 && (
          <div className="browser-preview-section">
            <span>{t('browser.readings')}</span>
            <ul>
              {card.readings.map((item) => (
                <li key={item.id}>
                  {item.kana}
                  {item.transcription ? ` — ${item.transcription}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        {card.examples.length > 0 && (
          <div className="browser-preview-section browser-preview-examples">
            <span>{t('browser.examples')}</span>
            <ul>
              {card.examples.map((item) => {
                const translation = cardExampleTranslation(card, item, t)
                return (
                  <li key={item.id}>
                    <span className="browser-preview-example-text">
                      {item.text}
                      {item.transcription ? ` — ${item.transcription}` : ''}
                      {translation ? ` — ${translation}` : ''}
                    </span>
                    {item.text.trim() && (
                      <SpeakButton text={item.text} label={t('session.listenExample')} />
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
