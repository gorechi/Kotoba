import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Card, Route } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { cardNote, deckDescription, deckTitle } from '../lib/content'
import { DeckCard } from '../components/DeckCard'
import { DeckForm } from '../components/DeckForm'
import { DeckSettingsForm } from '../components/DeckSettingsForm'
import { CardForm } from '../components/CardForm'
import { KanjiCardForm } from '../components/KanjiCardForm'
import { ConfirmDialog } from '../components/Modal'
import { FitText } from '../components/FitText'
import { Icon } from '../components/Icon'
import { ModeSwitch } from '../components/ModeSwitch'
import { deckStat } from '../lib/stats'
import {
  effectiveStudyMode,
  getDeckSettings,
  remainingNewForDeck,
  remainingReviewForDeck,
} from '../lib/deck-settings'
import { dueLabel } from '../lib/utils'

interface DecksProps {
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
}

export function Decks({ onNavigate, onStudy }: DecksProps) {
  const { data } = useStore()
  const { t } = useI18n()
  const [creating, setCreating] = useState(false)
  const now = Date.now()
  const decks = data.decks
    .filter((deck) => deck.kind !== 'kanji')
    .sort((a, b) => Number(b.builtin) - Number(a.builtin) || a.createdAt - b.createdAt)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('decks.eyebrow')}</div>
          <h1>{t('decks.title')}</h1>
          <p className="page-sub">{t('decks.subtitle')}</p>
        </div>
        <div className="page-head-actions">
          <ModeSwitch />
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={18} />
            {t('decks.new')}
          </button>
        </div>
      </header>

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

        <button className="deck-new" onClick={() => setCreating(true)}>
          <span className="deck-new-icon">
            <Icon name="plus" size={20} />
          </span>
          <strong>{t('home.newDeckTitle')}</strong>
          <span>{t('home.newDeckKanaHint')}</span>
        </button>
      </div>

      {creating && <DeckForm onClose={() => setCreating(false)} />}
    </div>
  )
}

interface DeckDetailProps {
  deckId: string
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
}

export function DeckDetail({ deckId, onNavigate, onStudy }: DeckDetailProps) {
  const { data, update, resetDeckProgress } = useStore()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingDeck, setEditingDeck] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [deletingDeck, setDeletingDeck] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'due' | 'learned'>('all')
  const [tagsExpanded, setTagsExpanded] = useState(false)

  const deck = data.decks.find((item) => item.id === deckId)
  const now = Date.now()

  if (!deck) {
    return (
      <div className="page">
        <button className="back-btn" onClick={() => onNavigate({ name: 'decks' })}>
          <Icon name="chevron-left" size={16} /> {t('deckDetail.backKana')}
        </button>
        <p className="empty-note">{t('deckDetail.notFound')}</p>
      </div>
    )
  }

  const isKanji = deck.kind === 'kanji'
  const title = deckTitle(deck, t)
  const listRoute: Route = isKanji ? { name: 'kanji' } : { name: 'decks' }
  const listLabel = isKanji ? t('deckDetail.backKanji') : t('deckDetail.backKana')

  const cards = data.cards
    .filter((card) => card.deckId === deckId)
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)

  // Частота использования тегов в колоде
  const tagFrequency = useMemo(() => {
    const counts = new Map<string, number>()
    cards.forEach((card) => {
      card.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1)
      })
    })
    return counts
  }, [cards])

  // Теги отсортированы по частоте (часто используемые — первыми)
  const sortedTags = useMemo(() => {
    const unique = new Set<string>()
    cards.forEach((card) => card.tags.forEach((tag) => unique.add(tag)))
    return [...unique].sort((a, b) => {
      const countA = tagFrequency.get(a) ?? 0
      const countB = tagFrequency.get(b) ?? 0
      return countB - countA || a.localeCompare(b)
    })
  }, [cards, tagFrequency])

  const MAX_TAGS_COLLAPSED = 6

  const search = query.trim().toLowerCase()
  const filtered = cards.filter((card) => {
    // Поиск по тексту
    if (search) {
      const readingsText = card.readings
        .map((item) => `${item.kana} ${item.transcription}`)
        .join(' ')
      const examplesText = card.examples
        .map((item) => `${item.text} ${item.transcription} ${item.translation}`)
        .join(' ')
      const text =
        `${card.front} ${card.reading} ${card.meaning} ${card.note} ${card.mnemonic} ${readingsText} ${examplesText}`.toLowerCase()
      if (!text.includes(search)) return false
    }
    // По тегам: если выбраны теги, карточка должна иметь хотя бы один из них
    if (activeTags.size > 0 && !card.tags.some((tag) => activeTags.has(tag))) return false
    // По статусу SRS
    if (statusFilter === 'new' && card.srs.introduced) return false
    if (statusFilter === 'due' && (!card.srs.introduced || card.srs.due > now)) return false
    if (statusFilter === 'learned' && (!card.srs.introduced || card.srs.due <= now)) return false
    return true
  })

  const stat = deckStat(data.cards, deckId, now)
  const newCount = Math.min(
    stat.fresh,
    remainingNewForDeck(data.history, deck, data.settings, now),
  )
  const dueCount = Math.min(stat.due, remainingReviewForDeck(data.history, deck, now))
  const canStudy = dueCount + newCount > 0 || stat.learned > 0
  const studyLabel =
    dueCount + newCount > 0 ? t('deckDetail.study') : t('deckDetail.practice')
  const watermark = (deck.nameJp || deck.name || '言').slice(0, 1)

  const deleteDeck = () => {
    update((draft) => {
      draft.decks = draft.decks.filter((item) => item.id !== deckId)
      draft.cards = draft.cards.filter((card) => card.deckId !== deckId)
    })
    onNavigate(listRoute)
  }

  const resetDeck = () => {
    resetDeckProgress(deckId)
  }

  const changeMode = (mode: 'reading' | 'writing') => {
    update((draft) => {
      const target = draft.decks.find((item) => item.id === deckId)
      if (!target) return
      target.settings = { ...getDeckSettings(target), studyMode: mode }
    })
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => onNavigate(listRoute)}>
        <Icon name="chevron-left" size={16} /> {listLabel}
      </button>

      <section className="deck-hero" style={{ '--accent': deck.accent } as CSSProperties}>
        <span className="deck-hero-watermark" aria-hidden="true">
          {watermark}
        </span>
        <div className="deck-hero-copy">
          <div className="eyebrow">
            {deck.builtin
              ? isKanji
                ? t('deckDetail.eyebrow.builtinKanji')
                : t('deckDetail.eyebrow.builtinKana')
              : isKanji
                ? t('deckDetail.eyebrow.kanji')
                : t('deckDetail.eyebrow.custom')}
          </div>
          <h1>
            {title}
            {deck.nameJp && <span className="title-jp">{deck.nameJp}</span>}
          </h1>
          <p className="deck-hero-desc">
            {deckDescription(deck, t) || t('deckDetail.noDescription')}
          </p>

          <div className="stat-chips">
            <span className="stat-chip">
              {t('deckDetail.learnedOf', { learned: stat.learned, total: stat.total })}
            </span>
            <span className="stat-chip">{t('deckDetail.dueCount', { n: dueCount })}</span>
            <span className="stat-chip">{t('deckDetail.newToday', { n: newCount })}</span>
          </div>

          <div className="mode-row">
            <span className="mode-row-label">{t('deckDetail.mode')}</span>
            <ModeSwitch
              value={effectiveStudyMode(deck, data.settings.studyMode)}
              onChange={changeMode}
            />
          </div>

          <div className="deck-hero-actions">
            <button className="btn btn-primary" onClick={() => onStudy(deck.id)} disabled={!canStudy}>
              {studyLabel}
              <Icon name="arrow-right" size={17} />
            </button>
            {!deck.builtin && (
              <button className="btn btn-ghost" onClick={() => setAdding(true)}>
                <Icon name="plus" size={17} />
                {isKanji ? t('deckDetail.addKanji') : t('deckDetail.addCard')}
              </button>
            )}
            {!deck.builtin && (
              <button
                className="icon-btn bordered"
                onClick={() => setEditingDeck(true)}
                title={t('deckDetail.editDeck')}
                aria-label={t('deckDetail.editDeck')}
              >
                <Icon name="pencil" size={17} />
              </button>
            )}
            <button
              className="icon-btn bordered"
              onClick={() => setSettingsOpen(true)}
              title={t('deckSettings.title')}
              aria-label={t('deckSettings.title')}
            >
              <Icon name="sliders" size={17} />
            </button>
            <button
              className="icon-btn bordered"
              onClick={() => setResetting(true)}
              title={t('deckDetail.resetProgress')}
              aria-label={t('deckDetail.resetProgress')}
            >
              <Icon name="rotate" size={17} />
            </button>
            {!deck.builtin && (
              <button
                className="icon-btn bordered danger"
                onClick={() => setDeletingDeck(true)}
                title={t('deckDetail.deleteDeck')}
                aria-label={t('deckDetail.deleteDeck')}
              >
                <Icon name="trash" size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="section-head list-head">
        <h2>
          {isKanji ? t('deckDetail.cardsKanji') : t('deckDetail.cardsCards')}{' '}
          <span className="count">
            {t('deckDetail.countOf', { shown: filtered.length, total: cards.length })}
          </span>
        </h2>
        <label className="search">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('deckDetail.searchPlaceholder')}
            aria-label={t('deckDetail.searchAria')}
          />
        </label>
      </div>

      {filtered.length === 0 && cards.length > 0 && (
        <div className="filter-bar">
          <button className="btn btn-ghost btn-small" onClick={() => setQuery('')}>
            <Icon name="x" size={14} /> {t('deckDetail.resetSearch')}
          </button>
        </div>
      )}

      {sortedTags.length > 0 && (
        <div className="filter-bar filter-bar--tags">
          <span className="filter-label">{t('deckDetail.tags')}</span>
          <div className={`tag-filter-wrap ${tagsExpanded ? 'expanded' : ''}`}>
            {sortedTags.map((tag, index) => {
              const active = activeTags.has(tag)
              const hidden = !tagsExpanded && index >= MAX_TAGS_COLLAPSED
              if (hidden) return null
              return (
                <button
                  key={tag}
                  type="button"
                  className={`tag-filter-btn ${active ? 'active' : ''}`}
                  onClick={() => {
                    const next = new Set(activeTags)
                    if (next.has(tag)) next.delete(tag)
                    else next.add(tag)
                    setActiveTags(next)
                  }}
                >
                  {tag}
                </button>
              )
            })}
            {sortedTags.length > MAX_TAGS_COLLAPSED && !tagsExpanded && (
              <button
                type="button"
                className="tag-filter-btn tag-filter-more"
                onClick={() => setTagsExpanded(true)}
              >
                {t('deckDetail.moreTags', { n: sortedTags.length - MAX_TAGS_COLLAPSED })}
              </button>
            )}
            {sortedTags.length > MAX_TAGS_COLLAPSED && tagsExpanded && (
              <button
                type="button"
                className="tag-filter-btn tag-filter-less"
                onClick={() => setTagsExpanded(false)}
              >
                {t('deckDetail.collapse')}
              </button>
            )}
          </div>
          {activeTags.size > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => setActiveTags(new Set())}
            >
              {t('deckDetail.clearTags')}
            </button>
          )}
        </div>
      )}

      <div className="filter-bar filter-bar--status">
        <span className="filter-label">{t('deckDetail.status')}</span>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          {t('deckDetail.statusAll')}
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'new' ? 'active' : ''}`}
          onClick={() => setStatusFilter('new')}
        >
          {t('deckDetail.statusNew')}
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'due' ? 'active' : ''}`}
          onClick={() => setStatusFilter('due')}
        >
          {t('deckDetail.statusDue')}
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'learned' ? 'active' : ''}`}
          onClick={() => setStatusFilter('learned')}
        >
          {t('deckDetail.statusLearned')}
        </button>
      </div>

      {deck.builtin && (
        <p className="builtin-note">
          <Icon name="lock" size={14} /> {t('deckDetail.builtinNote')}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="empty-note">
          {cards.length === 0
            ? isKanji
              ? t('deckDetail.emptyKanji')
              : t('deckDetail.emptyCards')
            : activeTags.size > 0 || statusFilter !== 'all' || query
              ? t('deckDetail.noMatchFilters')
              : t('deckDetail.noMatch')}
        </p>
      ) : (
        <div className="card-list">
          {filtered.map((card) => {
            const statusClass = !card.srs.introduced
              ? 'badge badge-soft'
              : card.srs.due <= now
                ? 'badge'
                : 'badge badge-muted'
            const note = cardNote(card, deck, t)
            return (
              <div className="card-row" key={card.id}>
                <FitText
                  className="row-jp"
                  text={card.front}
                  maxFontSize={27}
                  minFontSize={9}
                  title={card.front}
                />
                <div className="row-info">
                  <div className="row-main">
                    {(isKanji
                      ? [
                          card.meaning,
                          card.readings
                            .map((item) => item.kana)
                            .filter(Boolean)
                            .join('、'),
                        ]
                      : [card.reading, card.meaning]
                    )
                      .filter(Boolean)
                      .join('  ·  ') || '—'}
                  </div>
                  {isKanji && card.examples[0] && (
                    <div className="row-note">
                      {[card.examples[0].text, card.examples[0].translation]
                        .filter(Boolean)
                        .join(' — ')}
                    </div>
                  )}
                  {!isKanji && note && <div className="row-note">{note}</div>}
                  {card.tags.length > 0 && (
                    <div className="row-tags">
                      {card.tags.map((tag) => (
                        <span key={tag} className="row-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={statusClass}>{dueLabel(card.srs.due, card.srs.introduced, now)}</span>
                {!deck.builtin && (
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      onClick={() => setEditingCard(card)}
                      title={t('deckDetail.edit')}
                      aria-label={t('deckDetail.editCardAria')}
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => setDeletingCard(card)}
                      title={t('deckDetail.delete')}
                      aria-label={t('deckDetail.deleteCardAria')}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!deck.builtin && (
        <p className="list-total">
          {t(isKanji ? 'deckDetail.kanjiInDeck' : 'deckDetail.cardsInDeck', { n: cards.length })}
        </p>
      )}

      {adding &&
        (isKanji ? (
          <KanjiCardForm deckId={deck.id} onClose={() => setAdding(false)} />
        ) : (
          <CardForm deckId={deck.id} onClose={() => setAdding(false)} />
        ))}
      {editingCard &&
        (isKanji ? (
          <KanjiCardForm
            deckId={deck.id}
            card={editingCard}
            onClose={() => setEditingCard(null)}
          />
        ) : (
          <CardForm
            deckId={deck.id}
            card={editingCard}
            onClose={() => setEditingCard(null)}
          />
        ))}
      {editingDeck && <DeckForm deck={deck} onClose={() => setEditingDeck(false)} />}

      {deletingCard && (
        <ConfirmDialog
          title={t('deckDetail.deleteCardTitle')}
          text={t('deckDetail.deleteCardText', { front: deletingCard.front })}
          confirmLabel={t('deckDetail.delete')}
          danger
          onClose={() => setDeletingCard(null)}
          onConfirm={() => {
            update((draft) => {
              draft.cards = draft.cards.filter((item) => item.id !== deletingCard.id)
            })
          }}
        />
      )}

      {deletingDeck && (
        <ConfirmDialog
          title={t('deckDetail.deleteDeckTitle')}
          text={t('deckDetail.deleteDeckText', { name: title })}
          confirmLabel={t('deckDetail.deleteDeckConfirm')}
          danger
          onClose={() => setDeletingDeck(false)}
          onConfirm={deleteDeck}
        />
      )}

      {resetting && (
        <ConfirmDialog
          title={t('deckDetail.resetTitle')}
          text={t('deckDetail.resetText')}
          confirmLabel={t('common.reset')}
          onClose={() => setResetting(false)}
          onConfirm={resetDeck}
        />
      )}

      {settingsOpen && (
        <DeckSettingsForm deck={deck} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}
