import type { DuplicateCheck } from '../types'
import { useI18n } from '../lib/i18n-react'
import { toggleDuplicateCheck } from '../lib/duplicate-checks'

const OPTIONS: {
  value: DuplicateCheck
  labelKey: string
  hintKey: string
}[] = [
  {
    value: 'ignore',
    labelKey: 'settings.duplicatesIgnore',
    hintKey: 'settings.duplicatesIgnoreHint',
  },
  {
    value: 'ask-deck',
    labelKey: 'settings.duplicatesAskDeck',
    hintKey: 'settings.duplicatesAskDeckHint',
  },
  {
    value: 'ask-all',
    labelKey: 'settings.duplicatesAskAll',
    hintKey: 'settings.duplicatesAskAllHint',
  },
  {
    value: 'deny-deck',
    labelKey: 'settings.duplicatesDenyDeck',
    hintKey: 'settings.duplicatesDenyDeckHint',
  },
  {
    value: 'deny-all',
    labelKey: 'settings.duplicatesDenyAll',
    hintKey: 'settings.duplicatesDenyAllHint',
  },
]

interface DuplicateChecksProps {
  value: DuplicateCheck[]
  onChange: (value: DuplicateCheck[]) => void
}

export function DuplicateChecks({ value, onChange }: DuplicateChecksProps) {
  const { t } = useI18n()
  const ignore = value.includes('ignore')

  const renderOption = (option: (typeof OPTIONS)[number]) => {
    const checked = value.includes(option.value)
    const disabled = option.value !== 'ignore' && ignore
    return (
      <label
        key={option.value}
        className={`duplicate-option${checked ? ' is-checked' : ''}${
          disabled ? ' is-disabled' : ''
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            onChange(toggleDuplicateCheck(value, option.value, event.target.checked))
          }
        />
        <span className="duplicate-copy">
          <strong>{t(option.labelKey)}</strong>
          <span>{t(option.hintKey)}</span>
        </span>
      </label>
    )
  }

  const withinDeck = OPTIONS.filter(
    (option) => option.value === 'ask-deck' || option.value === 'deny-deck',
  )
  const allDecks = OPTIONS.filter(
    (option) => option.value === 'ask-all' || option.value === 'deny-all',
  )

  return (
    <div className="duplicate-checks">
      {renderOption(OPTIONS[0])}
      <div className="duplicate-divider" aria-hidden="true" />
      <div className="duplicate-columns">
        <div className="duplicate-column">{withinDeck.map(renderOption)}</div>
        <div className="duplicate-column">{allDecks.map(renderOption)}</div>
      </div>
    </div>
  )
}
