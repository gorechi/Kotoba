import { useI18n } from '../lib/i18n-react'
import { Modal } from './Modal'

interface ShortcutsDialogProps {
  onClose: () => void
}

const ROWS: { keys: string; labelKey: string }[] = [
  { keys: 'Ctrl K', labelKey: 'shortcuts.palette' },
  { keys: 'Space', labelKey: 'shortcuts.flip' },
  { keys: '1 – 4', labelKey: 'shortcuts.rate' },
  { keys: 'S', labelKey: 'shortcuts.speak' },
  { keys: 'Ctrl Z', labelKey: 'shortcuts.undo' },
  { keys: 'Esc', labelKey: 'shortcuts.exit' },
  { keys: '?', labelKey: 'shortcuts.help' },
]

export function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  const { t } = useI18n()

  return (
    <Modal title={t('shortcuts.title')} subtitle={t('shortcuts.subtitle')} onClose={onClose}>
      <div className="shortcuts-list">
        {ROWS.map((row) => (
          <div className="shortcuts-row" key={row.keys}>
            <kbd>{row.keys}</kbd>
            <span>{t(row.labelKey)}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
