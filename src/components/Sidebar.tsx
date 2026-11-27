import { useEffect, useState } from 'react'
import type { Route } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { streak } from '../lib/stats'
import { Icon, type IconName } from './Icon'

interface SidebarProps {
  route: Route
  onNavigate: (route: Route) => void
  onZen: () => void
  onSearch: () => void
  /** Тур временно разворачивает меню, не меняя выбор пользователя. */
  forceExpanded?: boolean
}

const NAV: {
  id: 'home' | 'decks' | 'kanji' | 'cards' | 'texts' | 'problems' | 'kanamap' | 'stats' | 'data'
  labelKey: string
  icon: IconName
}[] = [
  { id: 'home', labelKey: 'nav.study', icon: 'book' },
  { id: 'decks', labelKey: 'nav.kana', icon: 'kana' },
  { id: 'kanji', labelKey: 'nav.kanji', icon: 'kanji' },
  { id: 'cards', labelKey: 'nav.cards', icon: 'layers' },
  { id: 'texts', labelKey: 'nav.texts', icon: 'text' },
  { id: 'problems', labelKey: 'nav.problems', icon: 'query' },
  { id: 'kanamap', labelKey: 'nav.kanamap', icon: 'grid' },
  { id: 'stats', labelKey: 'nav.stats', icon: 'chart' },
  { id: 'data', labelKey: 'nav.data', icon: 'database' },
]

const SIDEBAR_STORAGE_KEY = 'kotoba.sidebarCollapsed'

export function Sidebar({ route, onNavigate, onZen, onSearch, forceExpanded }: SidebarProps) {
  const { data } = useStore()
  const { t } = useI18n()
  const days = streak(data.history, Date.now(), data.settings.dayStartHour)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* настройка не критична */
    }
  }, [collapsed])

  const isCollapsed = collapsed && !forceExpanded

  const deckKind = route.name === 'deck'
    ? data.decks.find((deck) => deck.id === route.deckId)?.kind ?? 'kana'
    : null

  const isActive = (id: string) => {
    if (id === 'decks') {
      return route.name === 'decks' || (route.name === 'deck' && deckKind === 'kana')
    }
    if (id === 'kanji') {
      return route.name === 'kanji' || (route.name === 'deck' && deckKind === 'kanji')
    }
    return route.name === id
  }

  return (
    <aside className={`sidebar${isCollapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-head">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            aria-expanded={!isCollapsed}
            aria-controls="sidebar-nav"
            data-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size={19} />
          </button>
        </div>

        <nav className="nav" id="sidebar-nav">
          <button
            type="button"
            className="nav-item nav-search"
            onClick={onSearch}
            data-label={t('palette.openAria')}
            title={t('palette.openAria')}
            aria-label={t('palette.openAria')}
          >
            <Icon name="search" size={19} />
            <span className="nav-label">{t('nav.search')}</span>
            <kbd className="nav-kbd">Ctrl K</kbd>
          </button>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item${isActive(item.id) ? ' active' : ''}`}
              onClick={() => onNavigate({ name: item.id } as Route)}
              aria-current={isActive(item.id) ? 'page' : undefined}
              data-label={t(item.labelKey)}
              data-tour={`nav-${item.id}`}
            >
              <Icon name={item.icon} size={19} />
              <span className="nav-label">{t(item.labelKey)}</span>
            </button>
          ))}
          <button
            type="button"
            className="nav-item nav-zen"
            onClick={onZen}
            data-label={t('nav.zen')}
            data-tour="nav-zen"
          >
            <Icon name="sparkles" size={19} />
            <span className="nav-label">{t('nav.zen')}</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="nav-item"
          onClick={() => onNavigate({ name: 'stats' })}
          data-label={days > 0 ? t('count.days', { n: days }) : t('sidebar.streak')}
        >
          <Icon
            name="flame"
            size={19}
            className={days > 0 ? 'streak-flame-lit' : undefined}
          />
          <span className="nav-label">
            {days > 0 ? t('count.days', { n: days }) : t('sidebar.streak')}
          </span>
        </button>

        <button
          type="button"
          className={`nav-item nav-settings${route.name === 'settings' ? ' active' : ''}`}
          onClick={() => onNavigate({ name: 'settings' })}
          aria-current={route.name === 'settings' ? 'page' : undefined}
          data-label={t('nav.settings')}
          data-tour="nav-settings"
        >
          <Icon name="sliders" size={19} />
          <span className="nav-label">{t('nav.settings')}</span>
        </button>

        <button
          type="button"
          className={`nav-item nav-help${
            route.name === 'help' ||
            route.name === 'helpGuide' ||
            route.name === 'ttsHelp'
              ? ' active'
              : ''
          }`}
          onClick={() => onNavigate({ name: 'help' })}
          aria-current={
            route.name === 'help' ||
            route.name === 'helpGuide' ||
            route.name === 'ttsHelp'
              ? 'page'
              : undefined
          }
          data-label={t('nav.help')}
          data-tour="nav-help"
        >
          <Icon name="help" size={19} />
          <span className="nav-label">{t('nav.help')}</span>
        </button>

        <p className="sidebar-note">
          <Icon name="lock" size={12} /> {t('sidebar.privacy')}
        </p>
      </div>
    </aside>
  )
}
