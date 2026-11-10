import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { Route } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { cardSearchText } from '../lib/card-browser'
import { cardMeaning, deckTitle } from '../lib/content'
import { Icon, type IconName } from './Icon'
import { Modal } from './Modal'

interface PaletteItem {
  id: string
  label: string
  meta?: string
  icon: IconName
  route: Route
}

interface PaletteSection {
  id: string
  title: string
  items: PaletteItem[]
}

interface CommandPaletteProps {
  onClose: () => void
  onNavigate: (route: Route) => void
}

export function CommandPalette({ onClose, onNavigate }: CommandPaletteProps) {
  const { data } = useStore()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const pageItems = useMemo<PaletteItem[]>(
    () => [
      { id: 'page-home', label: t('nav.study'), icon: 'book', route: { name: 'home' } },
      { id: 'page-decks', label: t('nav.kana'), icon: 'kana', route: { name: 'decks' } },
      { id: 'page-kanji', label: t('nav.kanji'), icon: 'kanji', route: { name: 'kanji' } },
      { id: 'page-cards', label: t('nav.cards'), icon: 'layers', route: { name: 'cards' } },
      {
        id: 'page-kanamap',
        label: t('nav.kanamap'),
        icon: 'grid',
        route: { name: 'kanamap' },
      },
      { id: 'page-stats', label: t('nav.stats'), icon: 'chart', route: { name: 'stats' } },
      {
        id: 'page-settings',
        label: t('nav.settings'),
        icon: 'sliders',
        route: { name: 'settings' },
      },
      { id: 'page-help', label: t('nav.help'), icon: 'help', route: { name: 'help' } },
    ],
    [t],
  )

  const sections = useMemo<PaletteSection[]>(() => {
    const search = query.trim().toLowerCase()
    const decks = data.decks
      .filter((deck) => {
        if (!search) return true
        const text =
          `${deckTitle(deck, t)} ${deck.name} ${deck.nameJp} ${deck.description}`.toLowerCase()
        return text.includes(search)
      })
      .slice(0, search ? 6 : 4)
      .map<PaletteItem>((deck) => ({
        id: `deck-${deck.id}`,
        label: deckTitle(deck, t),
        meta: deck.nameJp || t('common.deck'),
        icon: deck.kind === 'kanji' ? 'kanji' : 'kana',
        route: { name: 'deck', deckId: deck.id },
      }))

    const cards = search
      ? data.cards
          .filter((card) => cardSearchText(card, t).includes(search))
          .slice(0, 8)
          .map<PaletteItem>((card) => ({
            id: `card-${card.id}`,
            label: card.front,
            meta: [cardMeaning(card, t), card.reading].filter(Boolean).join(' · '),
            icon: 'layers',
            route: { name: 'cards', cardId: card.id },
          }))
      : []

    return [
      ...(search
        ? []
        : [{ id: 'pages', title: t('palette.pages'), items: pageItems }]),
      { id: 'decks', title: t('palette.decks'), items: decks },
      { id: 'cards', title: t('palette.cards'), items: cards },
    ].filter((section) => section.items.length > 0)
  }, [data.cards, data.decks, pageItems, query, t])

  const flat = useMemo(() => sections.flatMap((section) => section.items), [sections])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    const item = flat[active]
    if (!item) return
    document.getElementById(`palette-${item.id}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, flat])

  const choose = (item: PaletteItem | undefined) => {
    if (!item) return
    onClose()
    onNavigate(item.route)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((value) => (flat.length ? (value + 1) % flat.length : 0))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((value) => (flat.length ? (value - 1 + flat.length) % flat.length : 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(flat[active])
    }
  }

  return (
    <Modal
      title={t('palette.title')}
      subtitle={t('palette.hint')}
      onClose={onClose}
      initialFocusRef={inputRef}
    >
      <div className="palette">
        <div className="palette-search">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="palette-results" role="listbox" aria-label={t('palette.title')}>
          {flat.length === 0 && <p className="palette-empty">{t('palette.empty')}</p>}
          {sections.map((section) => (
            <div className="palette-section" key={section.id}>
              <div className="palette-section-title">{section.title}</div>
              {section.items.map((item) => {
                const index = flat.indexOf(item)
                return (
                  <button
                    key={item.id}
                    id={`palette-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    className={`palette-item${index === active ? ' active' : ''}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(item)}
                  >
                    <span className="palette-item-icon">
                      <Icon name={item.icon} size={17} />
                    </span>
                    <span className="palette-item-copy">
                      <strong>{item.label}</strong>
                      {item.meta && <span>{item.meta}</span>}
                    </span>
                    <Icon name="arrow-right" size={15} />
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
