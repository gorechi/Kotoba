import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../lib/i18n-react'
import { Icon } from './Icon'

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  /** Куда поставить начальный фокус вместо самого диалога. */
  initialFocusRef?: { current: HTMLElement | null }
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

let scrollLocks = 0
let previousBodyOverflow = ''
/** Порядок открытия модалок: фокус и Escape обрабатывает только верхняя. */
const modalStack: string[] = []

function lockScroll() {
  if (scrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLocks += 1
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) document.body.style.overflow = previousBodyOverflow
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  initialFocusRef,
}: ModalProps) {
  const { t } = useI18n()
  const instanceId = useId()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const isTopMost = () => modalStack[modalStack.length - 1] === instanceId

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    modalStack.push(instanceId)
    lockScroll()

    const dialog = dialogRef.current
    if (dialog && !dialog.contains(document.activeElement)) {
      const target =
        initialFocusRef?.current ??
        (dialog.querySelector<HTMLElement>(FOCUSABLE) as HTMLElement | null)
      ;(target ?? dialog).focus()
    }

    const onFocusIn = (event: FocusEvent) => {
      if (!isTopMost()) return
      const current = dialogRef.current
      if (current && !current.contains(event.target as Node)) current.focus()
    }
    document.addEventListener('focusin', onFocusIn)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      const index = modalStack.lastIndexOf(instanceId)
      if (index >= 0) modalStack.splice(index, 1)
      unlockScroll()
      previous?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFocusRef, instanceId])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && isTopMost()) onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !isTopMost()) return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) => element.getClientRects().length > 0,
    )
    if (focusable.length === 0) {
      event.preventDefault()
      dialog.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const current = document.activeElement

    if (event.shiftKey && (current === first || current === dialog)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && current === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={`modal${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t('modal.close')}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmProps {
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  danger?: boolean
}

export function ConfirmDialog({ title, text, confirmLabel, onConfirm, onClose, danger }: ConfirmProps) {
  const { t } = useI18n()
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            {t('confirm.cancel')}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="modal-text">{text}</p>
    </Modal>
  )
}
