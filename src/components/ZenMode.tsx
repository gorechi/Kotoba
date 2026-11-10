import { useEffect, useMemo, useRef, useState } from 'react'
import type { Card } from '../types'
import { useI18n } from '../lib/i18n-react'
import { cardMeaning } from '../lib/content'
import type { Translate } from '../lib/i18n'
import { FitText } from './FitText'
import { Icon } from './Icon'

const FRONT_MS = 10_000
const BACK_MS = 10_000
const FADE_MS = 900

function backText(card: Card, t: Translate): string {
  return cardMeaning(card, t).trim() || card.reading.trim() || card.front
}

export function ZenMode({ cards, onClose }: { cards: Card[]; onClose: () => void }) {
  const { t } = useI18n()
  const exitRef = useRef<HTMLButtonElement>(null)
  const usedRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)
  const [card, setCard] = useState<Card | null>(null)
  const [cycle, setCycle] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const pool = useMemo(
    () =>
      cards.filter(
        (item) =>
          !item.suspended &&
          Boolean(cardMeaning(item, t).trim() || item.reading.trim()),
      ),
    [cards, t],
  )

  const pickNext = (excludeId?: string): Card | null => {
    if (!pool.length) return null

    let candidates = pool.filter(
      (item) => !usedRef.current.has(item.id) && item.id !== excludeId,
    )
    if (!candidates.length) {
      usedRef.current.clear()
      candidates = pool.filter((item) => item.id !== excludeId)
    }
    if (!candidates.length) candidates = pool

    const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    usedRef.current.add(chosen.id)
    return chosen
  }

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    setCard(pickNext())
  }, [])

  useEffect(() => {
    if (!card) return

    setFlipped(false)
    setLeaving(false)

    const flipTimer = window.setTimeout(() => setFlipped(true), FRONT_MS)
    const leaveTimer = window.setTimeout(() => setLeaving(true), FRONT_MS + BACK_MS)
    const nextTimer = window.setTimeout(() => {
      const next = pickNext(card.id)
      if (next) {
        setFlipped(false)
        setLeaving(false)
        setCard(next)
        setCycle((value) => value + 1)
      } else {
        setCard(null)
      }
    }, FRONT_MS + BACK_MS + FADE_MS)

    return () => {
      window.clearTimeout(flipTimer)
      window.clearTimeout(leaveTimer)
      window.clearTimeout(nextTimer)
    }
  }, [card?.id, cycle])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('.modal')) {
        event.preventDefault()
        event.stopImmediatePropagation()
        onClose()
        return
      }
      // Не даём горячим клавишам сессии сработать под оверлеем.
      event.stopImmediatePropagation()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    exitRef.current?.focus()
    return () => previous?.focus()
  }, [])

  return (
    <div className="zen-overlay" role="dialog" aria-modal="true" aria-label={t('zen.exit')}>
      <button
        ref={exitRef}
        type="button"
        className="zen-exit"
        onClick={onClose}
        title={t('zen.exit')}
        aria-label={t('zen.exit')}
      >
        <Icon name="x" size={18} />
      </button>

      <div className="zen-ambient" aria-hidden="true">
        <span className="zen-wash" />
        <span className="zen-glow zen-glow--1" />
        <span className="zen-glow zen-glow--2" />
        <span className="zen-glow zen-glow--3" />
        <span className="zen-ripples" />
        <span className="zen-ripples zen-ripples--slow" />
        <span className="zen-sweep" />
        <span className="zen-vignette" />
      </div>

      <div className="zen-stage" aria-live="polite" aria-atomic="true">
        {card ? (
          <div
            className={`zen-card-shell${flipped ? ' is-flipped' : ''}${
              leaving ? ' is-leaving' : ''
            }`}
            key={`${card.id}-${cycle}`}
          >
            <span className="zen-card-shadow" aria-hidden="true" />
            <div className="zen-card-lift">
              <div className="zen-card">
                <div className="zen-face zen-face--front" aria-hidden={flipped}>
                  <FitText
                    className="zen-card-jp"
                    text={card.front}
                    maxFontSize={140}
                    minFontSize={28}
                  />
                </div>
                <div className="zen-face zen-face--back" aria-hidden={!flipped}>
                  <FitText
                    className="zen-card-translation"
                    text={backText(card, t)}
                    maxFontSize={96}
                    minFontSize={20}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="zen-empty">{t('zen.empty')}</p>
        )}
      </div>
    </div>
  )
}
