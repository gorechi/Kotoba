import type { DuplicateAction } from '../types'
import { useI18n } from '../lib/i18n-react'

const OPTIONS: { value: DuplicateAction; labelKey: string; hintKey: string }[] = [
  {
    value: 'ignore',
    labelKey: 'settings.duplicatesActionIgnore',
    hintKey: 'settings.duplicatesIgnoreHint',
  },
  {
    value: 'ask',
    labelKey: 'settings.duplicatesActionAsk',
    hintKey: 'settings.duplicatesAskHint',
  },
  {
    value: 'deny',
    labelKey: 'settings.duplicatesActionDeny',
    hintKey: 'settings.duplicatesDenyHint',
  },
]

interface DuplicateActionSettingsProps {
  value: DuplicateAction
  onChange: (value: DuplicateAction) => void
}

export function DuplicateActionSettings({ value, onChange }: DuplicateActionSettingsProps) {
  const { t } = useI18n()

  return (
    <div className="duplicate-settings">
      <div
        className="duplicate-radio-list"
        role="radiogroup"
        aria-label={t('settings.duplicatesQuestion')}
      >
        {OPTIONS.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={`duplicate-radio${checked ? ' is-checked' : ''}`}
            >
              <input
                type="radio"
                name="duplicate-action"
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
              />
              <span className="duplicate-radio-copy">
                <strong>{t(option.labelKey)}</strong>
                <span>{t(option.hintKey)}</span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
