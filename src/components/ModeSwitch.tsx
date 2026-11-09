import type { StudyMode } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { Icon, type IconName } from './Icon'

const MODES: { value: StudyMode; labelKey: string; icon: IconName; hintKey: string }[] = [
  {
    value: 'reading',
    labelKey: 'mode.reading',
    icon: 'book',
    hintKey: 'mode.hintReading',
  },
  {
    value: 'writing',
    labelKey: 'mode.writing',
    icon: 'pencil',
    hintKey: 'mode.hintWriting',
  },
]

interface ModeSwitchProps {
  value?: StudyMode
  onChange?: (mode: StudyMode) => void
}

export function ModeSwitch({ value, onChange }: ModeSwitchProps) {
  const { data, setSettings } = useStore()
  const { t } = useI18n()
  const mode = value ?? data.settings.studyMode
  const change = onChange ?? ((next: StudyMode) => setSettings({ studyMode: next }))

  return (
    <div className="mode-switch" role="group" aria-label={t('mode.groupAria')}>
      {MODES.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`mode-switch-btn ${item.value}${mode === item.value ? ' active' : ''}`}
          onClick={() => change(item.value)}
          aria-pressed={mode === item.value}
          title={t(item.hintKey)}
        >
          <Icon name={item.icon} size={15} />
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  )
}
