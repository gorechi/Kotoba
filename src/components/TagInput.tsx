import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

interface TagInputProps {
  id: string
  label: string
  tags: string[]
  /** Теги, уже встречающиеся в колоде. */
  suggestions: string[]
  onChange: (tags: string[]) => void
  placeholder: string
  removeTitle: (tag: string) => string
  removeAria: (tag: string) => string
  maxLength?: number
}

interface MenuPosition {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

/**
 * Поле тегов: ввод на всю ширину, выбранные теги — под полем.
 * Подсказки рисуются в портале, чтобы выходить за границы формы
 * и не создавать ей горизонтальный скролл.
 */
export function TagInput({
  id,
  label,
  tags,
  suggestions,
  onChange,
  placeholder,
  removeTitle,
  removeAria,
  maxLength = 40,
}: TagInputProps) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuId = useId()

  const query = value.trim().toLowerCase()
  const matches = query
    ? suggestions.filter(
        (tag) => tag.toLowerCase().includes(query) && !tags.includes(tag),
      )
    : []

  const updatePosition = () => {
    const input = inputRef.current
    if (!input) return
    const rect = input.getBoundingClientRect()
    const gap = 4
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const spaceAbove = rect.top - gap - 8
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow
    setPosition({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(200, openUp ? spaceAbove : spaceBelow)),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }

  const openMenu = () => {
    updatePosition()
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onScroll = () => updatePosition()
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed])
    setValue('')
    setActiveIndex(-1)
    setOpen(false)
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((item) => item !== tag))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) openMenu()
      if (!matches.length) return
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((prev) => {
        if (prev < 0) return delta === 1 ? 0 : matches.length - 1
        return (prev + delta + matches.length) % matches.length
      })
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      addTag(activeIndex >= 0 ? matches[activeIndex] ?? value : value)
      return
    }
    if (event.key === 'Escape') {
      event.stopPropagation()
      setValue('')
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="field tag-field">
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setActiveIndex(-1)
          updatePosition()
          setOpen(true)
        }}
        onFocus={openMenu}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={menuId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 && matches[activeIndex] ? `${menuId}-${activeIndex}` : undefined
        }
      />

      {open &&
        matches.length > 0 &&
        position &&
        createPortal(
          <div
            id={menuId}
            className="tag-suggestions"
            role="listbox"
            style={{
              left: position.left,
              width: position.width,
              top: position.top,
              bottom: position.bottom,
              maxHeight: position.maxHeight,
            }}
          >
            {matches.map((tag, index) => (
              <button
                key={tag}
                id={`${menuId}-${index}`}
                type="button"
                className={`tag-suggestion${index === activeIndex ? ' is-active' : ''}`}
                role="option"
                aria-selected={index === activeIndex}
                tabIndex={-1}
                onMouseDown={(event) => {
                  event.preventDefault()
                  addTag(tag)
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {tag}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {tags.length > 0 && (
        <div className="tag-list">
          {tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
              <button
                type="button"
                className="tag-remove"
                onClick={() => removeTag(tag)}
                title={removeTitle(tag)}
                aria-label={removeAria(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
