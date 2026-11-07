import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type CompositionEvent,
  type FocusEvent,
  type RefObject,
} from 'react'
import {
  KANA_MODES,
  convertForModeSwitch,
  convertRomajiTail,
  extraSigns,
  finalizeRomajiTail,
  type KanaMode,
} from '../lib/romaji'

interface KanaInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  mode: KanaMode
  onModeChange: (mode: KanaMode) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  tip?: string
  onBlur?: () => void
  /** Скрывает переключатели режимов и панель дополнительных знаков (для поля «Чтение»). */
  simple?: boolean
}

export function KanaInput({
  id,
  value,
  onChange,
  mode,
  onModeChange,
  placeholder,
  maxLength,
  autoFocus,
  inputRef,
  tip,
  onBlur,
  simple = false,
}: KanaInputProps) {
  const localRef = useRef<HTMLInputElement>(null)
  const ref = inputRef ?? localRef
  const composingRef = useRef(false)
  const caretRef = useRef<number | null>(null)
  const caretToEndRef = useRef(false)

  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    if (caretRef.current !== null) {
      const position = Math.min(caretRef.current, input.value.length)
      caretRef.current = null
      input.focus()
      input.setSelectionRange(position, position)
      return
    }
    if (caretToEndRef.current) {
      caretToEndRef.current = false
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }, [value, ref])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const next = input.value
    if (composingRef.current || mode === 'abc') {
      onChange(next)
      return
    }
    const atEnd =
      input.selectionStart === next.length && input.selectionEnd === next.length
    if (!atEnd) {
      onChange(next)
      return
    }
    const converted = convertRomajiTail(next, mode)
    if (converted !== next) caretToEndRef.current = true
    onChange(converted)
  }

  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false
    if (mode === 'abc') return
    const next = event.currentTarget.value
    const converted = convertRomajiTail(next, mode)
    if (converted !== next) {
      caretToEndRef.current = true
      onChange(converted)
    }
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const final = finalizeRomajiTail(event.currentTarget.value, mode)
    if (final !== event.currentTarget.value) onChange(final)
    onBlur?.()
  }

  const switchMode = (next: KanaMode) => {
    if (next === mode) return
    const converted = convertForModeSwitch(value, mode, next)
    if (converted !== value) {
      caretToEndRef.current = true
      onChange(converted)
    }
    onModeChange(next)
    ref.current?.focus()
  }

  const insertSign = (sign: string) => {
    const input = ref.current
    const start = input?.selectionStart ?? value.length
    const end = input?.selectionEnd ?? start
    const next = value.slice(0, start) + sign + value.slice(end)
    if (maxLength !== undefined && next.length > maxLength) return
    caretRef.current = start + sign.length
    onChange(next)
    input?.focus()
  }

  const signs = extraSigns(mode)

  return (
    <div className={`kana-input${mode === 'abc' ? '' : ' is-kana'}`}>
      <div className="kana-input-shell">
        <input
          ref={ref}
          id={id}
          className="jp-input"
          value={value}
          onChange={handleChange}
          onCompositionStart={() => {
            composingRef.current = true
          }}
          onCompositionEnd={handleCompositionEnd}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <div className="kana-modes" role="group" aria-label="Режим ввода">
          {!simple &&
            KANA_MODES.map((option) => (
              <button
                key={option.mode}
                type="button"
                className={`kana-mode${mode === option.mode ? ' active' : ''}`}
                aria-pressed={mode === option.mode}
                tabIndex={-1}
                title={option.title}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => switchMode(option.mode)}
              >
                {option.label}
              </button>
            ))}
        </div>
      </div>

      {mode !== 'abc' && tip && <p className="kana-tip">{tip}</p>}

      {!simple && signs.length > 0 && (
        <div className="kana-signs" role="group" aria-label="Дополнительные знаки">
          <span className="kana-signs-label">знаки</span>
          {signs.map((sign) => (
            <button
              key={sign}
              type="button"
              className="kana-sign"
              title={`Вставить ${sign}`}
              aria-label={`Вставить ${sign}`}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertSign(sign)}
            >
              {sign}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
