import type { Route } from '../types'
import { useStore } from '../state/store'
import { streak } from '../lib/stats'
import { plural } from '../lib/srs'
import { Icon, type IconName } from './Icon'

interface SidebarProps {
  route: Route
  onNavigate: (route: Route) => void
}

const NAV: {
  id: 'home' | 'decks' | 'kanji' | 'kanamap' | 'stats'
  label: string
  icon: IconName
}[] = [
  { id: 'home', label: 'Учить', icon: 'book' },
  { id: 'decks', label: 'Азбуки', icon: 'kana' },
  { id: 'kanji', label: 'Кандзи', icon: 'kanji' },
  { id: 'kanamap', label: 'Карта каны', icon: 'grid' },
  { id: 'stats', label: 'Статистика', icon: 'chart' },
]

export function Sidebar({ route, onNavigate }: SidebarProps) {
  const { data } = useStore()
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
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="streak-card" onClick={() => onNavigate({ name: 'stats' })}>
          <span className={`streak-flame${days > 0 ? ' lit' : ''}`}>
            <Icon name="flame" size={18} />
          </span>
          <span className="streak-copy">
            <strong>
              {days > 0 ? `${days} ${plural(days, 'день', 'дня', 'дней')}` : 'Серия'}
            </strong>
            <span>{days > 0 ? 'подряд — так держать' : 'начни серию сегодня'}</span>
          </span>
        </button>

        <button
          className={`nav-item nav-settings${route.name === 'settings' ? ' active' : ''}`}
          onClick={() => onNavigate({ name: 'settings' })}
        >
          <Icon name="sliders" size={19} />
          <span>Настройки</span>
        </button>

        <p className="sidebar-note">
          <Icon name="lock" size={12} /> Данные хранятся только на этом компьютере
        </p>
      </div>
    </aside>
  )
}
