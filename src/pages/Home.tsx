import { useState } from 'react'
import type { Route } from '../types'
import { useStore } from '../state/store'
import { DeckCard } from '../components/DeckCard'
import { DeckForm } from '../components/DeckForm'
import { Icon } from '../components/Icon'
import {
  deckStat,
  overallStat,
  remainingNewToday,
  streak,
  todayStat,
} from '../lib/stats'
import { plural } from '../lib/srs'
import { formatDateRu, greeting } from '../lib/utils'

interface HomeProps {
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
}

export function Home({ onNavigate, onStudy }: HomeProps) {
  const { data } = useStore()
  const [creatingDeck, setCreatingDeck] = useState(false)
  const now = Date.now()
  const overall = overallStat(data.cards, now)
  const allowance = remainingNewToday(data.history, data.settings, now)
  const newCount = Math.min(overall.fresh, allowance)
  const today = todayStat(data, now)
  const days = streak(data.history, now)
  const decks = [...data.decks].sort(
    (a, b) => Number(b.builtin) - Number(a.builtin) || a.createdAt - b.createdAt,
  )

  const due = overall.due
  const ready = due + newCount
  const canPractice = overall.learned > 0

  const ctaLabel = ready > 0 ? 'Учить всё' : canPractice ? 'Тренировать' : 'Выбрать колоду'
  const ctaAction = () => {
    if (ready > 0 || canPractice) onStudy('all')
    else onNavigate({ name: 'decks' })
  }

  const subline =
    overall.total === 0
      ? 'Встроенные азбуки уже готовы — начни с первой карточки.'
      : ready > 0
        ? `${due > 0 ? `${due} к повторению` : 'Повторений нет'} · ${
            newCount > 0
              ? `${newCount} ${plural(newCount, 'новая', 'новые', 'новых')}`
              : 'новые на сегодня закончились'
          }`
        : 'На сегодня всё повторено. Можно потренировать изученное или добавить свои карточки.'

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            {formatDateRu(now)} · сегодня
          </div>
          <h1>{greeting(now)}</h1>
          <p className="hero-sub">{subline}</p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={ctaAction}>
              {ctaLabel}
              <Icon name="arrow-right" size={18} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNavigate({ name: 'decks' })}>
              <Icon name="layers" size={18} />
              Колоды
            </button>
          </div>

          <div className="hero-meta">
            <span>
              <Icon name="flame" size={15} />
              {days > 0
                ? `${days} ${plural(days, 'день', 'дня', 'дней')} подряд`
                : 'серия ещё не начата'}
            </span>
            <span>
              <Icon name="check" size={15} />
              {today.reviews > 0
                ? `${today.reviews} ${plural(today.reviews, 'повторение', 'повторения', 'повторений')} сегодня`
                : 'сегодня пока без повторений'}
            </span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="enso" />
          <div className="hero-jp">今日も一歩ずつ</div>
          <div className="hero-kanji">言葉</div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Колоды</h2>
          <button className="link-btn" onClick={() => onNavigate({ name: 'decks' })}>
            Все колоды
            <Icon name="chevron-right" size={15} />
          </button>
        </div>

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

          <button
            className="deck-new"
            onClick={() => setCreatingDeck(true)}
            aria-label="Создать свою колоду"
          >
            <span className="deck-new-icon">
              <Icon name="plus" size={20} />
            </span>
            <strong>Своя колода</strong>
            <span>Слова, фразы, кандзи — что угодно</span>
          </button>
        </div>
      </section>

      {creatingDeck && <DeckForm onClose={() => setCreatingDeck(false)} />}
    </div>
  )
}
