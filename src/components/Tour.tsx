import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useI18n } from '../lib/i18n-react'
import { TOUR_STEPS, TOUR_TOTAL } from '../lib/tour'
import { Icon } from './Icon'

interface TourProps {
  /** Приветствие перед туром или сами шаги. */
  stage: 'welcome' | 'running'
  /** Индекс шага; значение TOUR_STEPS.length означает финальный экран. */
  stepIndex: number
  onStart: () => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onFinish: () => void
}

interface TourRect {
  left: number
  top: number
  width: number
  height: number
}

const HIGHLIGHT_PADDING = 6

export function Tour({
  stage,
  stepIndex,
  onStart,
  onNext,
  onBack,
  onSkip,
  onFinish,
}: TourProps) {
  const { t } = useI18n()
  const maskId = useId().replace(/:/g, '')
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const step = stage === 'running' ? TOUR_STEPS[stepIndex] : undefined
  const final = stepIndex >= TOUR_STEPS.length
  const [rects, setRects] = useState<TourRect[]>([])

  const selectorKey =
    step === undefined
      ? ''
      : [`[data-tour="nav-${step.nav}"]`, step.content ? '[data-tour="content"]' : '']
          .filter(Boolean)
          .join('|')

  useLayoutEffect(() => {
    if (!selectorKey) {
      setRects([])
      return
    }

    const measure = () => {
      const next: TourRect[] = []
      for (const selector of selectorKey.split('|')) {
        const element = document.querySelector(selector)
        if (!element) continue
        const rect = element.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) continue
        next.push({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        })
      }
      setRects(next)
    }

    measure()
    const frame = window.requestAnimationFrame(measure)
    const timer = window.setTimeout(measure, 250)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [selectorKey])

  useEffect(() => {
    primaryRef.current?.focus()
  }, [stage, stepIndex])

  const focusables = useCallback(() => {
    const card = cardRef.current
    if (!card) return []
    return Array.from(
      card.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    )
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onSkip()
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (stage === 'welcome') onStart()
        else if (final) onFinish()
        else onNext()
        return
      }
      if (event.key === 'ArrowLeft' && stage === 'running' && !final && stepIndex > 0) {
        event.preventDefault()
        onBack()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [final, focusables, onBack, onFinish, onNext, onSkip, onStart, stage, stepIndex])

  if (stage === 'welcome') {
    return (
      <div
        className="tour-layer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="tour-scrim" />
        <div className="tour-card tour-card--center" ref={cardRef}>
          <span className="tour-badge" aria-hidden="true">
            <Icon name="sparkles" size={19} />
          </span>
          <div className="eyebrow">{t('tour.eyebrow')}</div>
          <h2 id={titleId}>{t('tour.welcomeTitle')}</h2>
          <p>{t('tour.welcomeText')}</p>
          <div className="tour-actions">
            <button type="button" className="btn btn-ghost" onClick={onSkip}>
              {t('tour.skip')}
            </button>
            <button
              ref={primaryRef}
              type="button"
              className="btn btn-primary"
              onClick={onStart}
            >
              {t('tour.start')}
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (final) {
    return (
      <div
        className="tour-layer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="tour-scrim" />
        <div className="tour-card tour-card--center" ref={cardRef}>
          <span className="tour-badge" aria-hidden="true">
            <Icon name="check" size={19} />
          </span>
          <div className="eyebrow">
            {t('tour.step', { n: TOUR_TOTAL, total: TOUR_TOTAL })}
          </div>
          <h2 id={titleId}>{t('tour.finalTitle')}</h2>
          <p>{t('tour.finalText')}</p>
          <div className="tour-actions">
            <button
              ref={primaryRef}
              type="button"
              className="btn btn-primary"
              onClick={onFinish}
            >
              {t('tour.finish')}
              <Icon name="check" size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!step) return null

  return (
    <div
      className="tour-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg className="tour-dim" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <rect x={0} y={0} width="100%" height="100%" fill="white" />
            {rects.map((rect, index) => (
              <rect
                key={index}
                x={rect.left - HIGHLIGHT_PADDING}
                y={rect.top - HIGHLIGHT_PADDING}
                width={rect.width + HIGHLIGHT_PADDING * 2}
                height={rect.height + HIGHLIGHT_PADDING * 2}
                rx={16}
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="rgba(8, 10, 14, 0.62)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {rects.map((rect, index) => (
        <span
          key={index}
          className="tour-ring"
          aria-hidden="true"
          style={
            {
              left: rect.left - HIGHLIGHT_PADDING,
              top: rect.top - HIGHLIGHT_PADDING,
              width: rect.width + HIGHLIGHT_PADDING * 2,
              height: rect.height + HIGHLIGHT_PADDING * 2,
            } as CSSProperties
          }
        />
      ))}

      <div className="tour-card tour-card--step" ref={cardRef}>
        <div className="tour-meta">
          <span className="eyebrow">
            {t('tour.step', { n: stepIndex + 1, total: TOUR_TOTAL })}
          </span>
          <button type="button" className="tour-skip" onClick={onSkip}>
            {t('tour.skip')}
          </button>
        </div>
        <h2 id={titleId}>{t(step.titleKey)}</h2>
        <p>{t(step.textKey)}</p>
        <div className="tour-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onBack}
            disabled={stepIndex === 0}
          >
            {t('tour.back')}
          </button>
          <button
            ref={primaryRef}
            type="button"
            className="btn btn-primary"
            onClick={onNext}
          >
            {t('tour.next')}
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
