import type { Route } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { streak } from '../lib/stats'
import { Icon, type IconName } from './Icon'

interface SidebarProps {
  route: Route
  onNavigate: (route: Route) => void
}

const NAV: {
  id: 'home' | 'decks' | 'kanji' | 'kanamap' | 'stats'
  labelKey: string
  icon: IconName
}[] = [
  { id: 'home', labelKey: 'nav.study', icon: 'book' },
  { id: 'decks', labelKey: 'nav.kana', icon: 'kana' },
  { id: 'kanji', labelKey: 'nav.kanji', icon: 'kanji' },
  { id: 'kanamap', labelKey: 'nav.kanamap', icon: 'grid' },
  { id: 'stats', labelKey: 'nav.stats', icon: 'chart' },
]

export function Sidebar({ route, onNavigate }: SidebarProps) {
  const { data } = useStore()
  const { t } = useI18n()
  const days = streak(data.history)

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
    <aside className="sidebar">
      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item${isActive(item.id) ? ' active' : ''}`}
            onClick={() => onNavigate({ name: item.id } as Route)}
          >
            <Icon name={item.icon} size={19} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="streak-card" onClick={() => onNavigate({ name: 'stats' })}>
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
        >
          <Icon name="sliders" size={19} />
          <span>{t('nav.settings')}</span>
        </button>

        <p className="sidebar-note">
          <Icon name="lock" size={12} /> {t('sidebar.privacy')}
        </p>
      </div>
    </aside>
  )
}
