import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../lib/i18n-react'
import { readClipboardText, writeClipboardText } from '../lib/clipboard'

type EditableTarget = HTMLInputElement | HTMLTextAreaElement

interface MenuState {
  x: number
  y: number
  target: EditableTarget | null
  text: string
  start: number
  end: number
  editable: boolean
  readOnly: boolean
}

interface MenuItem {
  id: string
  label: string
  shortcut?: string
  disabled?: boolean
  run: () => void
}

function getTextInput(target: Element): EditableTarget | null {
  const field = target.closest('input, textarea')
  if (field instanceof HTMLTextAreaElement) return field
  if (field instanceof HTMLInputElement && field.selectionStart !== null) return field
  return null
}

function setInputValue(target: EditableTarget, value: string) {
  const proto =
    target instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(target, value)
  else target.value = value
  target.dispatchEvent(new Event('input', { bubbles: true }))
}

function replaceSelection(
  target: EditableTarget,
  start: number,
  end: number,
  insert: string,
) {
  const value = target.value
  const from = Math.min(start, value.length)
  const to = Math.min(end, value.length)
  const nextRaw = value.slice(0, from) + insert + value.slice(to)
  const next =
    target.maxLength > 0 ? nextRaw.slice(0, target.maxLength) : nextRaw
  setInputValue(target, next)
  target.focus()
  const caret = Math.min(next.length, from + insert.length)
  target.setSelectionRange(caret, caret)
}

export function ContextMenu() {
  const { t } = useI18n()
  const [menu, setMenu] = useState<MenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const closeMenu = (restoreFocus = true) => {
    if (restoreFocus) {
      const target = menu?.target
      const previous = previousFocus.current
      const focusTarget = target ?? previous
      if (focusTarget?.isConnected) {
        focusTarget.focus()
        if (
          target &&
          menu &&
          menu.editable &&
          target.selectionStart !== null &&
          target.selectionEnd !== null
        ) {
          target.setSelectionRange(menu.start, menu.end)
        }
      }
    }
    setMenu(null)
  }

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      if (target.closest('.context-menu')) {
        event.preventDefault()
        return
      }

      const input = getTextInput(target)
      if (input) {
        if (input.disabled) return
        const start = input.selectionStart ?? 0
        const end = input.selectionEnd ?? 0
        previousFocus.current = document.activeElement as HTMLElement | null
        setMenu({
          x: event.clientX,
          y: event.clientY,
          target: input,
          text: input.value.slice(start, end),
          start,
          end,
          editable: true,
          readOnly: input.readOnly,
        })
        event.preventDefault()
        return
      }

      const text = window.getSelection()?.toString() ?? ''
      if (!text.trim()) return
      previousFocus.current = document.activeElement as HTMLElement | null
      setMenu({
        x: event.clientX,
        y: event.clientY,
        target: null,
        text,
        start: 0,
        end: 0,
        editable: false,
        readOnly: false,
      })
      event.preventDefault()
    }

    document.addEventListener('contextmenu', onContextMenu)
    return () => document.removeEventListener('contextmenu', onContextMenu)
  }, [])

  useEffect(() => {
    if (!menu) return
    const onPointerDown = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setMenu(null)
    }
    const onScroll = () => setMenu(null)
    const onResize = () => setMenu(null)
    const onBlur = () => setMenu(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menu])

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const x = Math.max(8, Math.min(menu.x, window.innerWidth - rect.width - 8))
    const y = Math.max(8, Math.min(menu.y, window.innerHeight - rect.height - 8))
    if (x !== menu.x || y !== menu.y) setMenu({ ...menu, x, y })
  }, [menu])

  useEffect(() => {
    if (!menu) return
    const first = menuRef.current?.querySelector<HTMLButtonElement>(
      'button:not(:disabled)',
    )
    first?.focus()
  }, [menu])

  if (!menu) return null

  const copy = async () => {
    await writeClipboardText(menu.text)
    closeMenu()
  }

  const cut = async () => {
    if (!menu.target || menu.readOnly || !menu.text) return
    const copied = await writeClipboardText(menu.text)
    if (!copied) return
    replaceSelection(menu.target, menu.start, menu.end, '')
    closeMenu(false)
  }

  const paste = async () => {
    if (!menu.target || menu.readOnly) return
    const text = await readClipboardText()
    if (!text) {
      closeMenu()
      return
    }
    replaceSelection(menu.target, menu.start, menu.end, text)
    closeMenu(false)
  }

  const selectAll = () => {
    if (!menu.target) return
    menu.target.focus()
    menu.target.select()
    setMenu(null)
  }

  const items: MenuItem[] = menu.editable
    ? [
        {
          id: 'cut',
          label: t('contextMenu.cut'),
          shortcut: 'Ctrl+X',
          disabled: menu.readOnly || !menu.text,
          run: () => void cut(),
        },
        {
          id: 'copy',
          label: t('contextMenu.copy'),
          shortcut: 'Ctrl+C',
          disabled: !menu.text,
          run: () => void copy(),
        },
        {
          id: 'paste',
          label: t('contextMenu.paste'),
          shortcut: 'Ctrl+V',
          disabled: menu.readOnly,
          run: () => void paste(),
        },
        {
          id: 'select-all',
          label: t('contextMenu.selectAll'),
          shortcut: 'Ctrl+A',
          run: selectAll,
        },
      ]
    : [
        {
          id: 'copy',
          label: t('contextMenu.copy'),
          shortcut: 'Ctrl+C',
          run: () => void copy(),
        },
      ]

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      setMenu(null)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') {
      return
    }
    event.preventDefault()
    const buttons = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
    if (!buttons.length) return
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    let next = current
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = buttons.length - 1
    else if (event.key === 'ArrowDown') next = (current + 1 + buttons.length) % buttons.length
    else next = (current - 1 + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      aria-label={t('contextMenu.label')}
      style={{ left: menu.x, top: menu.y }}
      onKeyDown={onMenuKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {menu.editable && index === 3 && (
            <div className="context-menu-separator" role="separator" />
          )}
          <button
            type="button"
            role="menuitem"
            className="context-menu-item"
            disabled={item.disabled}
            onClick={item.run}
          >
            <span>{item.label}</span>
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </button>
        </Fragment>
      ))}
    </div>,
    document.body,
  )
}
