import type { StudyMode } from '../types'
import { useStore } from '../state/store'
import { Icon, type IconName } from './Icon'

const MODES: { value: StudyMode; label: string; icon: IconName; hint: string }[] = [
  {
    value: 'reading',
    label: 'Чтение',
    icon: 'book',
    hint: 'На карточке японский текст — вспоминаем чтение и перевод',
  },
  {
    value: 'writing',
    label: 'Письмо',
    icon: 'pencil',
    hint: 'На карточке перевод — пишем японский текст в тетради',
  },
]

export function ModeSwitch() {
  const { data, setSettings } = useStore()
  const mode = data.settings.studyMode

  return (
    <div className="mode-switch" role="group" aria-label="Режим обучения">
      {MODES.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`mode-switch-btn ${item.value}${mode === item.value ? ' active' : ''}`}
          onClick={() => setSettings({ studyMode: item.value })}
          aria-pressed={mode === item.value}
          title={item.hint}
        >
          <Icon name={item.icon} size={15} />
          {item.label}
        </button>
      ))}
    </div>
  )
}
