import { useEffect, useState, type InputHTMLAttributes } from 'react'
import { useI18n } from '../lib/i18n-react'
import { Icon } from './Icon'

interface NumberInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'min' | 'max'
  > {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

/** Числовое поле с собственными стрелками вместо нативных спиннеров. */
export function NumberInput({
  value,
  min,
  max,
  onChange,
  className,
  ...rest
}: NumberInputProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(() => String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next)))

  const change = (raw: string) => {
    setDraft(raw)
    if (!raw.trim()) return
    const next = Number(raw)
    if (Number.isFinite(next)) onChange(clamp(next))
  }

  const parsedDraft = draft.trim() ? Number(draft) : value
  const current = Number.isFinite(parsedDraft) ? clamp(parsedDraft) : value

  const commit = () => {
    const next = Number.isFinite(parsedDraft) ? current : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  const step = (delta: number) => {
    const next = clamp(current + delta)
    setDraft(String(next))
    onChange(next)
  }

  return (
    <div className={`number-control${className ? ` ${className}` : ''}`}>
      <input
        {...rest}
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => change(event.target.value)}
        onBlur={commit}
      />
      <span className="number-control-buttons">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => step(1)}
          aria-label={t('settings.moreAria')}
          title={t('settings.moreAria')}
        >
          <Icon name="chevron-up" size={11} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => step(-1)}
          aria-label={t('settings.lessAria')}
          title={t('settings.lessAria')}
        >
          <Icon name="chevron-down" size={11} />
        </button>
      </span>
    </div>
  )
}
