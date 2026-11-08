import { useState } from 'react'
import type { Route } from '../types'
import { useStore } from '../state/store'
import { DeckCard } from '../components/DeckCard'
import { DeckForm } from '../components/DeckForm'
import { Icon } from '../components/Icon'
import { ModeSwitch } from '../components/ModeSwitch'
import { deckStat, remainingNewToday } from '../lib/stats'

interface KanjiDecksProps {
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
}

export function KanjiDecks({ onNavigate, onStudy }: KanjiDecksProps) {
  const { data } = useStore()
  const [creating, setCreating] = useState(false)
  const now = Date.now()
  const allowance = remainingNewToday(data.history, data.settings, now)
  const decks = data.decks
    .filter((deck) => deck.kind === 'kanji')
    .sort((a, b) => a.createdAt - b.createdAt)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Кандзи</div>
          <h1>Кандзи</h1>
          <p className="page-sub">
            Отдельные колоды для иероглифов: перевод, чтения и примеры использования.
          </p>
        </div>
        <div className="page-head-actions">
          <ModeSwitch />
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} />
            Новая колода
          </button>
        </div>
      </header>

      {decks.length === 0 && (
        <p className="empty-note">
          Пока нет колод с иероглифами. Создай первую колоду и добавь в неё карточки.
        </p>
      )}

      <div className="deck-grid">
        {decks.map((deck) => {
          const stat = deckStat(data.cards, deck.id, now)
          return (
            <DeckCard
              key={deck.id}
              deck={deck}
              stat={stat}
              newCount={Math.min(stat.fresh, allowance)}
              onOpen={() => onNavigate({ name: 'deck', deckId: deck.id })}
              onStudy={() => onStudy(deck.id)}
            />
          )
        })}

        <button className="deck-new" onClick={() => setCreating(true)}>
          <span className="deck-new-icon">
            <Icon name="plus" size={20} />
          </span>
          <strong>Создать колоду</strong>
          <span>Кандзи, чтения и примеры</span>
        </button>
      </div>

      {creating && <DeckForm kind="kanji" onClose={() => setCreating(false)} />}
    </div>
  )
}
