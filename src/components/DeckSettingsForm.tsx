import { useState, type FormEvent } from 'react'
import type { Deck, DeckOrder, DeckStudyMode, SessionOrder } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { getDeckSettings } from '../lib/deck-settings'
import { SESSION_ORDER_OPTIONS, sessionOrderLabelKey } from '../lib/session-order'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { NumberInput } from './NumberInput'
import { Select } from './Select'

const ORDERS: { value: DeckOrder; labelKey: string }[] = [
  { value: 'order', labelKey: 'deckSettings.orderOrder' },
  { value: 'random', labelKey: 'deckSettings.orderRandom' },
  { value: 'frequency', labelKey: 'deckSettings.orderFrequency' },
  { value: 'jlpt', labelKey: 'deckSettings.orderJlpt' },
]

const MODES: { value: DeckStudyMode; labelKey: string }[] = [
  { value: 'global', labelKey: 'deckSettings.modeGlobal' },
  { value: 'reading', labelKey: 'mode.reading' },
  { value: 'writing', labelKey: 'mode.writing' },
]

export function DeckSettingsForm({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const { data, update } = useStore()
  const { t } = useI18n()
  const initial = getDeckSettings(deck)

  const [allowNew, setAllowNew] = useState(initial.allowNew)
  const [useGlobalNew, setUseGlobalNew] = useState(initial.newPerDay === null)
  const [newPerDay, setNewPerDay] = useState(initial.newPerDay ?? data.settings.newPerDay)
  const [limitReviews, setLimitReviews] = useState(initial.reviewLimit !== null)
  const [reviewLimit, setReviewLimit] = useState(initial.reviewLimit ?? 100)
  const [useGlobalSession, setUseGlobalSession] = useState(initial.sessionSize === null)
  const [sessionSize, setSessionSize] = useState(
    initial.sessionSize ?? (data.settings.sessionSize || 20),
  )
  const [useGlobalOrder, setUseGlobalOrder] = useState(initial.sessionOrder === null)
  const [sessionOrder, setSessionOrder] = useState<SessionOrder>(
    initial.sessionOrder ?? data.settings.sessionOrder,
  )
  const [order, setOrder] = useState<DeckOrder>(initial.order)
  const [studyMode, setStudyMode] = useState<DeckStudyMode>(initial.studyMode)

  const reset = () => {
    setAllowNew(true)
    setUseGlobalNew(true)
    setNewPerDay(data.settings.newPerDay)
    setLimitReviews(false)
    setReviewLimit(100)
    setUseGlobalSession(true)
    setSessionSize(data.settings.sessionSize || 20)
    setUseGlobalOrder(true)
    setSessionOrder(data.settings.sessionOrder)
    setOrder('order')
    setStudyMode('global')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const safeNewPerDay = Number.isFinite(newPerDay)
      ? Math.min(500, Math.max(1, Math.round(newPerDay)))
      : data.settings.newPerDay
    const safeReviewLimit = Number.isFinite(reviewLimit)
      ? Math.min(2000, Math.max(1, Math.round(reviewLimit)))
      : 1
    const safeSessionSize = Number.isFinite(sessionSize)
      ? Math.min(500, Math.max(0, Math.round(sessionSize)))
      : 0

    update((current) => ({
      ...current,
      decks: current.decks.map((item) =>
        item.id === deck.id
          ? {
              ...item,
              settings: {
                newPerDay: allowNew && !useGlobalNew ? safeNewPerDay : null,
                reviewLimit: limitReviews ? safeReviewLimit : null,
                sessionSize: useGlobalSession ? null : safeSessionSize,
                sessionOrder: useGlobalOrder ? null : sessionOrder,
                order,
                allowNew,
                studyMode,
              },
            }
          : item,
      ),
    }))
    onClose()
  }

  return (
    <Modal
      title={t('deckSettings.title')}
      subtitle={deckTitle(deck, t)}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" form="deck-settings-form" className="btn btn-primary">
            {t('common.save')}
          </button>
        </>
      }
    >
      <form id="deck-settings-form" className="form" onSubmit={submit}>
        <section className="deck-settings-section">
          <h3>{t('deckSettings.newCards')}</h3>

          <label className="deck-settings-check">
            <input
              type="checkbox"
              checked={allowNew}
              onChange={(event) => setAllowNew(event.target.checked)}
            />
            <span>{t('deckSettings.allowNew')}</span>
          </label>

          {allowNew && (
            <>
              <label className="deck-settings-check">
                <input
                  type="checkbox"
                  checked={useGlobalNew}
                  onChange={(event) => setUseGlobalNew(event.target.checked)}
                />
                <span>
                  {t('deckSettings.useGlobalNew', { n: data.settings.newPerDay })}
                </span>
              </label>

              {!useGlobalNew && (
                <div className="field">
                  <label htmlFor="deck-new-limit">{t('deckSettings.customNew')}</label>
                  <NumberInput
                    id="deck-new-limit"
                    min={1}
                    max={500}
                    value={newPerDay}
                    onChange={setNewPerDay}
                  />
                </div>
              )}
            </>
          )}
        </section>

        <section className="deck-settings-section">
          <h3>{t('deckSettings.reviews')}</h3>

          <label className="deck-settings-check">
            <input
              type="checkbox"
              checked={limitReviews}
              onChange={(event) => setLimitReviews(event.target.checked)}
            />
            <span>{t('deckSettings.limitReviews')}</span>
          </label>

          {limitReviews && (
            <div className="field">
              <label htmlFor="deck-review-limit">{t('deckSettings.reviewLimitLabel')}</label>
              <NumberInput
                id="deck-review-limit"
                min={1}
                max={2000}
                value={reviewLimit}
                onChange={setReviewLimit}
              />
            </div>
          )}
          <p className="hint">{t('deckSettings.reviewLimitHint')}</p>
        </section>

        <section className="deck-settings-section">
          <h3>{t('deckSettings.session')}</h3>

          <label className="deck-settings-check">
            <input
              type="checkbox"
              checked={useGlobalSession}
              onChange={(event) => setUseGlobalSession(event.target.checked)}
            />
            <span>
              {t('deckSettings.useGlobalSession', {
                n:
                  data.settings.sessionSize === 0
                    ? t('settings.sessionSizeAll')
                    : data.settings.sessionSize,
              })}
            </span>
          </label>

          {!useGlobalSession && (
            <div className="field">
              <label htmlFor="deck-session-size">{t('deckSettings.sessionSizeLabel')}</label>
              <NumberInput
                id="deck-session-size"
                min={0}
                max={500}
                value={sessionSize}
                onChange={setSessionSize}
              />
            </div>
          )}
          <p className="hint">{t('deckSettings.sessionSizeHint')}</p>
        </section>

        <section className="deck-settings-section">
          <h3>{t('settings.sessionOrder')}</h3>

          <label className="deck-settings-check">
            <input
              type="checkbox"
              checked={useGlobalOrder}
              onChange={(event) => setUseGlobalOrder(event.target.checked)}
            />
            <span>
              {t('deckSettings.useGlobalSessionOrder', {
                n: t(sessionOrderLabelKey(data.settings.sessionOrder)),
              })}
            </span>
          </label>

          {!useGlobalOrder && (
            <div className="field">
              <label htmlFor="deck-session-order">{t('settings.sessionOrder')}</label>
              <Select
                id="deck-session-order"
                value={sessionOrder}
                onChange={(event) => setSessionOrder(event.target.value as SessionOrder)}
              >
                {SESSION_ORDER_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </section>

        <section className="deck-settings-section">
          <div className="field">
            <label htmlFor="deck-order">{t('deckSettings.order')}</label>
            <Select
              id="deck-order"
              value={order}
              onChange={(event) => setOrder(event.target.value as DeckOrder)}
            >
              {ORDERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </Select>
          </div>
          <p className="hint">{t('deckSettings.orderHint')}</p>
        </section>

        <section className="deck-settings-section">
          <span className="label">{t('deckSettings.mode')}</span>
          <div className="segmented">
            {MODES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={studyMode === item.value ? 'active' : ''}
                onClick={() => setStudyMode(item.value)}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="btn btn-ghost btn-small" onClick={reset}>
          <Icon name="rotate" size={14} />
          {t('deckSettings.reset')}
        </button>
      </form>
    </Modal>
  )
}
