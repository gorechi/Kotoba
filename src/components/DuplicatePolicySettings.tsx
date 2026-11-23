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
    <fieldset className="duplicate-column" disabled={value.ignoreAll}>
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
                disabled={value.ignoreAll}
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
      <label className={`duplicate-master${value.ignoreAll ? ' is-checked' : ''}`}>
        <input
          type="checkbox"
          checked={value.ignoreAll}
          onChange={(event) => onChange({ ...value, ignoreAll: event.target.checked })}
        />
        <span className="duplicate-copy">
          <strong>{t('settings.duplicatesIgnoreAll')}</strong>
          <span>{t('settings.duplicatesIgnoreAllHint')}</span>
        </span>
      </label>

      <div className="duplicate-divider" aria-hidden="true" />

      <div className={`duplicate-columns${value.ignoreAll ? ' is-disabled' : ''}`}>
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
