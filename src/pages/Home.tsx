import { useState } from 'react'
import type { Route } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { DeckCard } from '../components/DeckCard'
import { DeckForm } from '../components/DeckForm'
import { Icon } from '../components/Icon'
import { ModeSwitch } from '../components/ModeSwitch'
import { deckStat, overallStat, streak, todayStat } from '../lib/stats'
import {
  remainingNewForDeck,
  remainingReviewForDeck,
} from '../lib/deck-settings'
import { buildStudyQueue } from '../lib/study'
import { formatDate, greeting } from '../lib/utils'

interface HomeProps {
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
}

export function Home({ onNavigate, onStudy }: HomeProps) {
  const { data } = useStore()
  const { t } = useI18n()
  const [creatingDeck, setCreatingDeck] = useState(false)
  const [creatingDeckKind, setCreatingDeckKind] = useState<'kana' | 'kanji'>('kana')
  const now = Date.now()
  const overall = overallStat(data.cards, now)
  const queue = buildStudyQueue(
    data.cards,
    data.decks,
    'all',
    data.history,
    data.settings,
    now,
  )
  const due = queue.filter((item) => !item.isNew).length
  const newCount = queue.filter((item) => item.isNew).length
  const today = todayStat(data, now)
  const days = streak(data.history, now)
  const decks = data.decks
    .filter((deck) => deck.kind !== 'kanji')
    .sort((a, b) => Number(b.builtin) - Number(a.builtin) || a.createdAt - b.createdAt)

  const kanjiDecks = data.decks
    .filter((deck) => deck.kind === 'kanji')
    .sort((a, b) => a.createdAt - b.createdAt)

  const ready = queue.length
  const canPractice = overall.learned > 0

  const ctaLabel =
    ready > 0 ? t('home.cta.studyAll') : canPractice ? t('home.cta.practice') : t('home.cta.chooseDeck')
  const ctaAction = () => {
    if (ready > 0 || canPractice) onStudy('all')
    else onNavigate({ name: 'decks' })
  }

  const subline =
    overall.total === 0
      ? t('home.sub.empty')
      : ready > 0
        ? `${due > 0 ? t('home.sub.due', { n: due }) : t('home.sub.noDue')} · ${
            newCount > 0 ? t('home.sub.newLeft', { n: newCount }) : t('home.sub.newDone')
          }`
        : t('home.sub.done')

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">{t('home.dateToday', { date: formatDate(now) })}</div>
          <h1>{greeting(now)}</h1>
          <p className="hero-sub">{subline}</p>

          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={ctaAction}>
              {ctaLabel}
              <Icon name="arrow-right" size={18} />
            </button>
          </div>

          <div className="hero-meta">
            <span>
              <Icon name="flame" size={15} />
              {days > 0 ? t('home.streak', { n: days }) : t('home.streakEmpty')}
            </span>
            <span>
              <Icon name="check" size={15} />
              {today.reviews > 0
                ? t('home.reviewsToday', { n: today.reviews })
                : t('home.noReviews')}
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
          <h2>{t('home.sectionKana')}</h2>
          <button className="link-btn" onClick={() => onNavigate({ name: 'decks' })}>
            {t('home.allDecks')}
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
                newCount={Math.min(
                  stat.fresh,
                  remainingNewForDeck(data.history, deck, data.settings, now),
                )}
                dueCount={Math.min(stat.due, remainingReviewForDeck(data.history, deck, now))}
                onOpen={() => onNavigate({ name: 'deck', deckId: deck.id })}
                onStudy={() => onStudy(deck.id)}
              />
            )
          })}

          <button
            className="deck-new"
            onClick={() => {
              setCreatingDeckKind('kana')
              setCreatingDeck(true)
            }}
            aria-label={t('home.newDeckAria')}
          >
            <span className="deck-new-icon">
              <Icon name="plus" size={20} />
            </span>
            <strong>{t('home.newDeckTitle')}</strong>
            <span>{t('home.newDeckKanaHint')}</span>
          </button>
        </div>
      </section>

      {kanjiDecks.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>{t('home.sectionKanji')}</h2>
            <button className="link-btn" onClick={() => onNavigate({ name: 'kanji' })}>
              {t('home.allKanji')}
              <Icon name="chevron-right" size={15} />
            </button>
          </div>

          <div className="deck-grid">
            {kanjiDecks.map((deck) => {
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
                  dueCount={Math.min(stat.due, remainingReviewForDeck(data.history, deck, now))}
                  onOpen={() => onNavigate({ name: 'deck', deckId: deck.id })}
                  onStudy={() => onStudy(deck.id)}
                />
              )
            })}

            <button
              className="deck-new"
              onClick={() => {
                setCreatingDeckKind('kanji')
                setCreatingDeck(true)
              }}
              aria-label={t('home.newDeckAria')}
            >
              <span className="deck-new-icon">
                <Icon name="plus" size={20} />
              </span>
              <strong>{t('home.newDeckTitle')}</strong>
              <span>{t('home.newDeckKanjiHint')}</span>
            </button>
          </div>
        </section>
      )}

      {creatingDeck && <DeckForm kind={creatingDeckKind} onClose={() => setCreatingDeck(false)} />}
    </div>
  )
}
