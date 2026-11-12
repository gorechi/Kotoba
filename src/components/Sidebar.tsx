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
}

const NAV: {
  id: 'home' | 'decks' | 'kanji' | 'cards' | 'problems' | 'kanamap' | 'stats' | 'data'
  labelKey: string
  icon: IconName
}[] = [
  { id: 'home', labelKey: 'nav.study', icon: 'book' },
  { id: 'decks', labelKey: 'nav.kana', icon: 'kana' },
  { id: 'kanji', labelKey: 'nav.kanji', icon: 'kanji' },
  { id: 'cards', labelKey: 'nav.cards', icon: 'layers' },
  { id: 'problems', labelKey: 'nav.problems', icon: 'query' },
  { id: 'kanamap', labelKey: 'nav.kanamap', icon: 'grid' },
  { id: 'stats', labelKey: 'nav.stats', icon: 'chart' },
  { id: 'data', labelKey: 'nav.data', icon: 'database' },
]

const SIDEBAR_STORAGE_KEY = 'kotoba.sidebarCollapsed'

export function Sidebar({ route, onNavigate, onZen, onSearch }: SidebarProps) {
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
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-head">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            data-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} />
          </button>
        </div>

        <nav className="nav">
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
              className={`nav-item${isActive(item.id) ? ' active' : ''}`}
              onClick={() => onNavigate({ name: item.id } as Route)}
              data-label={t(item.labelKey)}
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
          >
            <Icon name="sparkles" size={19} />
            <span className="nav-label">{t('nav.zen')}</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <button
          className="streak-card"
          onClick={() => onNavigate({ name: 'stats' })}
          data-label={t('nav.stats')}
        >
          <span className={`streak-flame${days > 0 ? ' lit' : ''}`}>
            <Icon name="flame" size={18} />
          </span>
          <span className="streak-copy">
            <strong>{days > 0 ? t('count.days', { n: days }) : t('sidebar.streak')}</strong>
            <span>{days > 0 ? t('sidebar.streakActive') : t('sidebar.streakEmpty')}</span>
          </span>
        </button>

        <button
          className={`nav-item nav-settings${route.name === 'settings' ? ' active' : ''}`}
          onClick={() => onNavigate({ name: 'settings' })}
          data-label={t('nav.settings')}
        >
          <Icon name="sliders" size={19} />
          <span className="nav-label">{t('nav.settings')}</span>
        </button>

        <button
          className={`nav-item nav-help${
            route.name === 'help' ||
            route.name === 'helpGuide' ||
            route.name === 'ttsHelp'
              ? ' active'
              : ''
          }`}
          onClick={() => onNavigate({ name: 'help' })}
          data-label={t('nav.help')}
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
