import { useEffect } from 'react'
import type { Rating } from '../../types'

interface SessionShortcutsOptions {
  finished: boolean
  revealed: boolean
  mnemonicEditing: boolean
  mnemonicOpen: boolean
  canUndo: boolean
  /** Отключить клавиши, пока открыт другой диалог. */
  disabled?: boolean
  onClose: () => void
  onUndo: () => void
  onToggleAnswer: () => void
  onCancelMnemonic: () => void
  onCloseMnemonic: () => void
  onSpeak: () => void
  onRate: (rating: Rating) => void
}

const RATING_KEYS: Record<string, Rating> = {
  '1': 'again',
  '2': 'hard',
  '3': 'good',
  '4': 'easy',
}

/** Глобальные горячие клавиши сессии: Space, 1–4, Ctrl+Z, Esc. */
export function useSessionShortcuts({
  finished,
  revealed,
  mnemonicEditing,
  mnemonicOpen,
  canUndo,
  disabled = false,
  onClose,
  onUndo,
  onToggleAnswer,
  onCancelMnemonic,
  onCloseMnemonic,
  onSpeak,
  onRate,
}: SessionShortcutsOptions) {
  useEffect(() => {
    if (disabled) return undefined
    const onKey = (event: KeyboardEvent) => {
      // Пока открыт диалог, клавишами управляет только он.
      if (document.querySelector('.modal')) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.repeat) return

      if (event.key === 'Escape') {
        event.preventDefault()
        if (mnemonicEditing) {
          onCancelMnemonic()
          return
        }
        if (mnemonicOpen) {
          onCloseMnemonic()
          return
        }
        onClose()
        return
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        (event.code === 'KeyZ' || event.key.toLowerCase() === 'z')
      ) {
        if (!canUndo) return
        event.preventDefault()
        onUndo()
        return
      }

      if (finished) return
      if (event.key === ' ' || event.key === 'Enter') {
        if (target?.closest('button')) return
        event.preventDefault()
        onToggleAnswer()
        return
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSpeak()
        return
      }

      if (!revealed) return
      const rating = RATING_KEYS[event.key]
      if (rating) {
        event.preventDefault()
        onRate(rating)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    canUndo,
    disabled,
    finished,
    mnemonicEditing,
    mnemonicOpen,
    onCancelMnemonic,
    onClose,
    onCloseMnemonic,
    onRate,
    onSpeak,
    onToggleAnswer,
    onUndo,
    revealed,
  ])
}
