import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type ReactElement,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

interface SelectOption {
  value: string
  label: ReactNode
  disabled: boolean
}

interface MenuPosition {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

function readOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== 'option') return
    const element = child as ReactElement<{
      value?: string | number
      disabled?: boolean
      children?: ReactNode
    }>
    const { value, disabled, children: label } = element.props
    options.push({
      value: value === undefined ? String(label ?? '') : String(value),
      label,
      disabled: Boolean(disabled),
    })
  })
  return options
}

/**
 * Выпадающий список в стиле приложения.
 *
 * Системный `<select>` на Windows раскрашивает выбранный пункт синим цветом
 * операционной системы, и это нельзя переопределить через CSS. Поэтому
 * рисуем свой список, но сохраняем привычный API: `value`, `onChange`,
 * `id`, `aria-label`. Меню выводится в портал, чтобы его не обрезали модалки.
 */
export function Select({
  children,
  value,
  onChange,
  disabled,
  id,
  title,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  const options = useMemo(() => readOptions(children), [children])
  const valueString = Array.isArray(value)
    ? String(value[0] ?? '')
    : value === undefined
      ? ''
      : String(value)

  const selectedIndex = options.findIndex((option) => option.value === valueString)
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : ''

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const menuId = useId()

  const optionId = (index: number) => `${menuId}-option-${index}`

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const gap = 4
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const spaceAbove = rect.top - gap - 8
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow
    setMenuPosition({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(280, openUp ? spaceAbove : spaceBelow)),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }

  const firstEnabled = () => options.findIndex((option) => !option.disabled)

  const openMenu = () => {
    if (disabled || options.length === 0) return
    updatePosition()
    const initial =
      selectedIndex >= 0 && !options[selectedIndex].disabled
        ? selectedIndex
        : firstEnabled()
    setActiveIndex(initial)
    setOpen(true)
  }

  const closeMenu = (focusTrigger = false) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }

  const moveActive = (delta: 1 | -1) => {
    if (!options.length) return
    let next = activeIndex
    for (let step = 0; step < options.length; step += 1) {
      next = (next + delta + options.length) % options.length
      if (!options[next].disabled) {
        setActiveIndex(next)
        return
      }
    }
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    setOpen(false)
    triggerRef.current?.focus()
    if (option.value !== valueString) {
      onChange?.({
        target: { value: option.value },
      } as ChangeEvent<HTMLSelectElement>)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (!open) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        openMenu()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActive(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveActive(-1)
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(firstEnabled())
        break
      case 'End':
        event.preventDefault()
        for (let index = options.length - 1; index >= 0; index -= 1) {
          if (!options[index].disabled) {
            setActiveIndex(index)
            break
          }
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        choose(activeIndex)
        break
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        closeMenu(true)
        break
      case 'Tab':
        closeMenu()
        break
    }
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    const onResize = () => updatePosition()

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    document.getElementById(optionId(activeIndex))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open])

  const menuStyle: CSSProperties | undefined = menuPosition
    ? {
        position: 'fixed',
        left: menuPosition.left,
        width: menuPosition.width,
        top: menuPosition.top,
        bottom: menuPosition.bottom,
        maxHeight: menuPosition.maxHeight,
      }
    : undefined

  return (
    <span className="select">
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`select-trigger${className ? ` ${className}` : ''}`}
        title={title}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="select-value">{selectedLabel}</span>
      </button>
      <Icon name="chevron-down" size={16} className="select-chevron" />

      {open &&
        menuPosition &&
        createPortal(
          <ul
            ref={menuRef}
            id={menuId}
            role="listbox"
            className="select-menu"
            style={menuStyle}
            aria-label={ariaLabel}
          >
            {options.map((option, index) => (
              <li
                key={`${option.value}-${index}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === selectedIndex}
                aria-disabled={option.disabled || undefined}
                className={`select-option${index === activeIndex ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </span>
  )
}
