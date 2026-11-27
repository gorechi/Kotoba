import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { Card, TextDocument, TextMark } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { cardMeaning, deckTitle, isProtectedDeck } from '../lib/content'
import {
  buildTextMarks,
  cardsForTextSearch,
  mergeTextMarks,
  sameMarks,
} from '../lib/text-marks'
import { CardForm } from './CardForm'
import { Icon } from './Icon'
import { KanjiCardForm } from './KanjiCardForm'
import { Modal } from './Modal'
import { Select } from './Select'

interface TextReaderProps {
  text: TextDocument
  onBack: () => void
}

interface SelectionState {
  text: string
  start: number
  end: number
  x: number
  y: number
}

interface PopoverState {
  cardIds: string[]
  x: number
  y: number
}

function selectionOffsets(container: HTMLElement, range: Range) {
  const measure = document.createRange()
  measure.selectNodeContents(container)
  measure.setEnd(range.startContainer, range.startOffset)
  const start = measure.toString().length
  measure.setEnd(range.endContainer, range.endOffset)
  return { start, end: measure.toString().length }
}

export function TextReader({ text, onBack }: TextReaderProps) {
  const { data, update } = useStore()
  const { t, locale } = useI18n()
  const [cardMode, setCardMode] = useState(false)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [cardTarget, setCardTarget] = useState<SelectionState | null>(null)
  const [targetDeckId, setTargetDeckId] = useState('')
  const [cardForm, setCardForm] = useState<{ deckId: string; front: string } | null>(null)
  const [manualRange, setManualRange] = useState<{ start: number; end: number } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const readerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<HTMLButtonElement>(null)

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale.intl, { dateStyle: 'medium' }),
    [locale.intl],
  )
  const cardsById = useMemo(
    () => new Map(data.cards.map((card) => [card.id, card])),
    [data.cards],
  )
  const searchCards = useMemo(
    () => cardsForTextSearch(data.cards, data.decks),
    [data.cards, data.decks],
  )
  const searchCardIds = useMemo(
    () => new Set(searchCards.map((card) => card.id)),
    [searchCards],
  )
  const decksById = useMemo(
    () => new Map(data.decks.map((deck) => [deck.id, deck])),
    [data.decks],
  )
  const availableDecks = useMemo(
    () => data.decks.filter((deck) => !isProtectedDeck(deck)),
    [data.decks],
  )

  const automaticMarks = useMemo(
    () => buildTextMarks(text.body, searchCards),
    [searchCards, text.body],
  )
  const manualMarks = useMemo(
    () =>
      (text.marks ?? [])
        .filter((mark) => mark.manual)
        .map((mark) => ({
          ...mark,
          cardIds: mark.cardIds.filter((id) => searchCardIds.has(id)),
        }))
        .filter((mark) => mark.cardIds.length > 0),
    [searchCardIds, text.marks],
  )
  const marks = useMemo(
    () => mergeTextMarks(automaticMarks, manualMarks),
    [automaticMarks, manualMarks],
  )

  useEffect(() => {
    if (sameMarks(text.marks ?? [], marks)) return
    update((current) => ({
      ...current,
      texts: current.texts.map((item) =>
        item.id === text.id ? { ...item, marks } : item,
      ),
    }))
  }, [marks, text.id, text.marks, update])

  useEffect(() => {
    if (!popover) return
    const close = (event: Event) => {
      if (popoverRef.current?.contains(event.target as Node)) return
      setPopover(null)
    }
    const onScroll = () => setPopover(null)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopover(null)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [popover])

  useEffect(() => {
    if (!selection) return
    const onDown = (event: PointerEvent) => {
      if (selectionRef.current?.contains(event.target as Node)) return
      setSelection(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelection(null)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [selection])

  useEffect(() => {
    const close = () => {
      setPopover(null)
      setSelection(null)
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [])

  const handleSelection = () => {
    const container = readerRef.current
    const selected = window.getSelection()
    if (!container || !selected || selected.isCollapsed || selected.rangeCount === 0) {
      setSelection(null)
      return
    }
    const range = selected.getRangeAt(0)
    if (!container.contains(range.commonAncestorContainer)) {
      setSelection(null)
      return
    }
    const offsets = selectionOffsets(container, range)
    const raw = text.body.slice(offsets.start, offsets.end)
    const start = offsets.start + raw.length - raw.trimStart().length
    const end = offsets.end - (raw.length - raw.trimEnd().length)
    const selectedText = text.body.slice(start, end)
    if (!selectedText) {
      setSelection(null)
      return
    }
    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) {
      setSelection(null)
      return
    }
    setSelection({
      text: selectedText,
      start,
      end,
      x: Math.min(window.innerWidth - 100, Math.max(100, rect.left + rect.width / 2)),
      y: rect.bottom + 8,
    })
  }

  const openDeckPicker = () => {
    if (!selection) return
    if (availableDecks.length === 0) {
      setError(t('texts.noCardDecks'))
      setSelection(null)
      return
    }
    setError(null)
    setTargetDeckId(availableDecks[0].id)
    setCardTarget(selection)
    setSelection(null)
  }

  const startCard = () => {
    if (!cardTarget || !targetDeckId) return
    setManualRange({ start: cardTarget.start, end: cardTarget.end })
    setCardForm({ deckId: targetDeckId, front: cardTarget.text })
    setCardTarget(null)
    window.getSelection()?.removeAllRanges()
  }

  const closeCardForm = () => {
    setCardForm(null)
    setManualRange(null)
    window.getSelection()?.removeAllRanges()
  }

  const handleCardSaved = (card: Card) => {
    const range = manualRange
    if (!range) return
    update((current) => ({
      ...current,
      texts: current.texts.map((item) => {
        if (item.id !== text.id) return item
        const manual = item.marks.filter(
          (mark) => mark.manual && (mark.end <= range.start || range.end <= mark.start),
        )
        return {
          ...item,
          marks: [
            ...manual,
            { start: range.start, end: range.end, cardIds: [card.id], manual: true },
          ],
        }
      }),
    }))
    setManualRange(null)
  }

  const openPopover = (event: ReactMouseEvent, mark: TextMark) => {
    const cardIds = mark.cardIds.filter((id) => cardsById.has(id))
    if (!cardIds.length) return
    setPopover({
      cardIds,
      x: Math.min(window.innerWidth - 300, Math.max(12, event.clientX)),
      y: Math.min(window.innerHeight - 220, event.clientY + 12),
    })
  }

  const renderPlain = (): ReactNode => text.body

  const renderMarked = (): ReactNode => {
    const parts: ReactNode[] = []
    let cursor = 0
    for (const mark of marks) {
      if (mark.start > cursor) {
        parts.push(
          <span key={`plain-${cursor}`}>{text.body.slice(cursor, mark.start)}</span>,
        )
      }
      const fragment = text.body.slice(mark.start, mark.end)
      const hasCards = mark.cardIds.some((id) => cardsById.has(id))
      if (hasCards) {
        parts.push(
          <button
            key={`mark-${mark.start}`}
            type="button"
            className="text-mark"
            title={t('texts.showCard')}
            onClick={(event) => openPopover(event, mark)}
          >
            {fragment}
          </button>,
        )
      } else {
        parts.push(<span key={`mark-${mark.start}`}>{fragment}</span>)
      }
      cursor = mark.end
    }
    if (cursor < text.body.length) {
      parts.push(<span key={`tail-${cursor}`}>{text.body.slice(cursor)}</span>)
    }
    return parts
  }

  const popoverCards = popover
    ? popover.cardIds
        .map((id) => cardsById.get(id))
        .filter((card): card is Card => Boolean(card))
    : []

  return (
    <div className="page texts-page text-reader-page">
      <button className="back-btn" onClick={onBack}>
        <Icon name="chevron-left" size={16} />
        {t('texts.back')}
      </button>

      <header className="page-head">
        <div>
          <div className="eyebrow">{t('texts.eyebrow')}</div>
          <h1>{text.title}</h1>
          <p className="page-sub">
            {t('texts.createdAt', { date: dateFormat.format(text.createdAt) })}
          </p>
        </div>
        <div className="page-head-actions">
          <div className="segmented">
            <button
              type="button"
              className={cardMode ? '' : 'active'}
              onClick={() => {
                setCardMode(false)
                setPopover(null)
                setSelection(null)
              }}
            >
              {t('texts.readMode')}
            </button>
            <button
              type="button"
              className={cardMode ? 'active' : ''}
              onClick={() => {
                setCardMode(true)
                setPopover(null)
                setSelection(null)
              }}
            >
              {t('texts.cardsMode')}
            </button>
          </div>
        </div>
      </header>

      {error && <p className="form-error">{error}</p>}

      <article
        className={`text-reader${cardMode ? ' is-cards' : ''}`}
        ref={readerRef}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
      >
        {cardMode ? renderMarked() : renderPlain()}
      </article>

      {createPortal(
        <>
          {selection && (
            <button
              ref={selectionRef}
              type="button"
              className="text-selection-action"
              style={{ left: selection.x, top: selection.y }}
              onClick={openDeckPicker}
            >
              <Icon name="plus" size={15} />
              {t('texts.createCard')}
            </button>
          )}

          {popover && popoverCards.length > 0 && (
            <div
              ref={popoverRef}
              className="text-popover"
              style={
                {
                  left: popover.x,
                  top: popover.y,
                } as CSSProperties
              }
              role="dialog"
              aria-label={t('texts.cardPopoverAria')}
            >
              {popoverCards.map((card) => {
                const deck = decksById.get(card.deckId)
                return (
                  <div className="text-popover-item" key={card.id}>
                    <div className="text-popover-head">
                      <strong>{card.front}</strong>
                      {card.reading && <span>{card.reading}</span>}
                    </div>
                    <p>{cardMeaning(card, t) || t('browser.noValue')}</p>
                    <span className="text-popover-deck">
                      {deck ? deckTitle(deck, t) : t('trash.unknownDeck')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>,
        document.body,
      )}

      {cardTarget && (
        <Modal
          title={t('texts.createCardTitle')}
          subtitle={t('texts.createCardText', { word: cardTarget.text })}
          onClose={() => setCardTarget(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setCardTarget(null)}>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={startCard}
                disabled={!targetDeckId}
              >
                {t('texts.createCardContinue')}
              </button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="text-card-deck">{t('texts.createCardDeck')}</label>
            <Select
              id="text-card-deck"
              value={targetDeckId}
              onChange={(event) => setTargetDeckId(event.target.value)}
            >
              {availableDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deckTitle(deck, t)}
                </option>
              ))}
            </Select>
          </div>
        </Modal>
      )}

      {cardForm &&
        (() => {
          const deck = data.decks.find((item) => item.id === cardForm.deckId)
          if (!deck) return null
          return deck.kind === 'kanji' ? (
            <KanjiCardForm
              deckId={cardForm.deckId}
              initialFront={cardForm.front}
              onSaved={handleCardSaved}
              onClose={closeCardForm}
            />
          ) : (
            <CardForm
              deckId={cardForm.deckId}
              initialFront={cardForm.front}
              onSaved={handleCardSaved}
              onClose={closeCardForm}
            />
          )
        })()}
    </div>
  )
}
