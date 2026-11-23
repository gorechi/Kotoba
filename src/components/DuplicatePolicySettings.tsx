import type { DuplicateAction, DuplicatePolicy } from '../types'
import { useI18n } from '../lib/i18n-react'

const ACTIONS: { value: DuplicateAction; labelKey: string }[] = [
  { value: 'ignore', labelKey: 'settings.duplicatesActionIgnore' },
  { value: 'ask', labelKey: 'settings.duplicatesActionAsk' },
  { value: 'deny', labelKey: 'settings.duplicatesActionDeny' },
]

interface DuplicatePolicySettingsProps {
  value: DuplicatePolicy
  onChange: (value: DuplicatePolicy) => void
}

export function DuplicatePolicySettings({ value, onChange }: DuplicatePolicySettingsProps) {
  const { t } = useI18n()

  const radioGroup = (
    name: string,
    titleKey: string,
    selected: DuplicateAction,
    onSelect: (action: DuplicateAction) => void,
  ) => (
    <fieldset className="duplicate-column">
      <legend className="duplicate-column-title">{t(titleKey)}</legend>
      <div className="duplicate-radio-list">
        {ACTIONS.map((action) => {
          const checked = selected === action.value
          return (
            <label
              key={action.value}
              className={`duplicate-radio${checked ? ' is-checked' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={action.value}
                checked={checked}
                onChange={() => onSelect(action.value)}
              />
              <span>{t(action.labelKey)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )

  return (
    <div className="duplicate-settings">
      <div className="duplicate-columns">
        {radioGroup(
          'duplicate-within',
          'settings.duplicatesWithinTitle',
          value.withinDeck,
          (withinDeck) => onChange({ ...value, withinDeck }),
        )}
        {radioGroup(
          'duplicate-across',
          'settings.duplicatesAcrossTitle',
          value.acrossDecks,
          (acrossDecks) => onChange({ ...value, acrossDecks }),
        )}
      </div>
    </div>
  )
}
