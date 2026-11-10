import { useEffect } from 'react'
import type { Rating } from '../../types'

interface SessionShortcutsOptions {
  finished: boolean
  revealed: boolean
  mnemonicEditing: boolean
  mnemonicOpen: boolean
  canUndo: boolean
  onClose: () => void
  onUndo: () => void
  onToggleAnswer: () => void
  onCancelMnemonic: () => void
  onCloseMnemonic: () => void
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
  onClose,
  onUndo,
  onToggleAnswer,
  onCancelMnemonic,
  onCloseMnemonic,
  onRate,
}: SessionShortcutsOptions) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
    finished,
    mnemonicEditing,
    mnemonicOpen,
    onCancelMnemonic,
    onClose,
    onCloseMnemonic,
    onRate,
    onToggleAnswer,
    onUndo,
    revealed,
  ])
}
