import { useState } from 'react'
import type { Route } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { DeckCard } from '../components/DeckCard'
import { DeckForm } from '../components/DeckForm'
import { Icon } from '../components/Icon'
import { ModeSwitch } from '../components/ModeSwitch'
import { deckStat } from '../lib/stats'
import { remainingNewForDeck, remainingReviewForDeck } from '../lib/deck-settings'

interface KanjiDecksProps {
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
}

export function KanjiDecks({ onNavigate, onStudy }: KanjiDecksProps) {
  const { data } = useStore()
  const { t } = useI18n()
  const [creating, setCreating] = useState(false)
  const now = Date.now()
  const decks = data.decks
    .filter((deck) => deck.kind === 'kanji')
    .sort((a, b) => a.createdAt - b.createdAt)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('kanjiPage.eyebrow')}</div>
          <h1>{t('kanjiPage.title')}</h1>
          <p className="page-sub">{t('kanjiPage.subtitle')}</p>
        </div>
        <div className="page-head-actions">
          <ModeSwitch />
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} />
            {t('kanjiPage.new')}
          </button>
        </div>
      </header>

      {decks.length === 0 && <p className="empty-note">{t('kanjiPage.empty')}</p>}

      <div className="deck-grid">
        {decks.map((deck) => {
          const stat = deckStat(data.cards, deck.id, now)
          return (
            <DeckCard
              key={deck.id}
              deck={deck}
              stat={stat}
              newCount={Math.min(
                stat.fresh,
                remainingNewForDeck(data.history, deck, data.settings, now),
              )}
              dueCount={Math.min(
                stat.due,
                remainingReviewForDeck(
                  data.history,
                  deck,
                  now,
                  data.settings.dayStartHour,
                ),
              )}
              onOpen={() => onNavigate({ name: 'deck', deckId: deck.id })}
              onStudy={() => onStudy(deck.id)}
            />
          )
        })}

        <button className="deck-new" onClick={() => setCreating(true)}>
          <span className="deck-new-icon">
            <Icon name="plus" size={20} />
          </span>
          <strong>{t('home.newDeckTitle')}</strong>
          <span>{t('kanjiPage.createHint')}</span>
        </button>
      </div>

      {creating && <DeckForm kind="kanji" onClose={() => setCreating(false)} />}
    </div>
  )
}
