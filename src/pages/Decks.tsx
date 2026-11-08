import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { Card, Route } from '../types'
import { useStore } from '../state/store'
import { DeckCard } from '../components/DeckCard'
import { DeckForm } from '../components/DeckForm'
import { CardForm } from '../components/CardForm'
import { ConfirmDialog } from '../components/Modal'
import { FitText } from '../components/FitText'
import { Icon } from '../components/Icon'
import { ModeSwitch } from '../components/ModeSwitch'
import { deckStat, remainingNewToday } from '../lib/stats'
import { freshSrs, plural } from '../lib/srs'
import { dueLabel } from '../lib/utils'

interface DecksProps {
  onNavigate: (route: Route) => void
  onStudy: (deckId: string) => void
}

export function Decks({ onNavigate, onStudy }: DecksProps) {
  const { data } = useStore()
  const [creating, setCreating] = useState(false)
  const now = Date.now()
  const allowance = remainingNewToday(data.history, data.settings, now)
  const decks = [...data.decks].sort(
    (a, b) => Number(b.builtin) - Number(a.builtin) || a.createdAt - b.createdAt,
  )

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Колоды</div>
          <h1>Мои колоды</h1>
          <p className="page-sub">
            Встроенные азбуки и твои собственные наборы. Всё хранится на этом компьютере.
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
          <span>Слова, фразы, кандзи — что угодно</span>
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
  const { data, update } = useStore()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingDeck, setEditingDeck] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)
  const [deletingDeck, setDeletingDeck] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'due' | 'learned'>('all')
  const [tagsExpanded, setTagsExpanded] = useState(false)

  const deck = data.decks.find((item) => item.id === deckId)
  const now = Date.now()

  if (!deck) {
    return (
      <div className="page">
        <button className="back-btn" onClick={() => onNavigate({ name: 'decks' })}>
          <Icon name="chevron-left" size={16} /> Все колоды
        </button>
        <p className="empty-note">Колода не найдена.</p>
      </div>
    )
  }

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
    cards.forEach((card) => card.tags.forEach((t) => unique.add(t)))
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
      const text = `${card.front} ${card.reading} ${card.meaning} ${card.note} ${card.mnemonic}`.toLowerCase()
      if (!text.includes(search)) return false
    }
    // По тегам: если выбраны теги, карточка должна иметь хотя бы один из них
    if (activeTags.size > 0 && !card.tags.some((t) => activeTags.has(t))) return false
    // По статусу SRS
    if (statusFilter === 'new' && card.srs.introduced) return false
    if (statusFilter === 'due' && (!card.srs.introduced || card.srs.due > now)) return false
    if (statusFilter === 'learned' && (!card.srs.introduced || card.srs.due <= now)) return false
    return true
  })

  const stat = deckStat(data.cards, deckId, now)
  const allowance = remainingNewToday(data.history, data.settings, now)
  const newCount = Math.min(stat.fresh, allowance)
  const canStudy = stat.due + newCount > 0 || stat.learned > 0
  const studyLabel = stat.due + newCount > 0 ? 'Учить' : 'Тренировать'
  const watermark = (deck.nameJp || deck.name || '言').slice(0, 1)

  const deleteDeck = () => {
    update((draft) => {
      draft.decks = draft.decks.filter((item) => item.id !== deckId)
      draft.cards = draft.cards.filter((card) => card.deckId !== deckId)
    })
    onNavigate({ name: 'decks' })
  }

  const resetDeck = () => {
    update((draft) => {
      draft.cards = draft.cards.map((card) =>
        card.deckId === deckId ? { ...card, srs: freshSrs() } : card,
      )
    })
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => onNavigate({ name: 'decks' })}>
        <Icon name="chevron-left" size={16} /> Все колоды
      </button>

      <section className="deck-hero" style={{ '--accent': deck.accent } as CSSProperties}>
        <span className="deck-hero-watermark" aria-hidden="true">
          {watermark}
        </span>
        <div className="deck-hero-copy">
          <div className="eyebrow">{deck.builtin ? 'Встроенная колода' : 'Своя колода'}</div>
          <h1>
            {deck.name}
            {deck.nameJp && <span className="title-jp">{deck.nameJp}</span>}
          </h1>
          <p className="deck-hero-desc">
            {deck.description || 'Колода без описания. Добавляй карточки и учи их по одному.'}
          </p>

          <div className="stat-chips">
            <span className="stat-chip">
              <b>{stat.learned}</b> из {stat.total} выучено
            </span>
            <span className="stat-chip">
              <b>{stat.due}</b> к повторению
            </span>
            <span className="stat-chip">
              <b>{newCount}</b> новых сегодня
            </span>
          </div>

          <div className="mode-row">
            <span className="mode-row-label">Режим</span>
            <ModeSwitch />
          </div>

          <div className="deck-hero-actions">
            <button className="btn btn-primary" onClick={() => onStudy(deck.id)} disabled={!canStudy}>
              {studyLabel}
              <Icon name="arrow-right" size={17} />
            </button>
            {!deck.builtin && (
              <button className="btn btn-ghost" onClick={() => setAdding(true)}>
                <Icon name="plus" size={17} />
                Карточка
              </button>
            )}
            {!deck.builtin && (
              <button
                className="icon-btn bordered"
                onClick={() => setEditingDeck(true)}
                title="Изменить колоду"
                aria-label="Изменить колоду"
              >
                <Icon name="pencil" size={17} />
              </button>
            )}
            <button
              className="icon-btn bordered"
              onClick={() => setResetting(true)}
              title="Сбросить прогресс"
              aria-label="Сбросить прогресс"
            >
              <Icon name="rotate" size={17} />
            </button>
            {!deck.builtin && (
              <button
                className="icon-btn bordered danger"
                onClick={() => setDeletingDeck(true)}
                title="Удалить колоду"
                aria-label="Удалить колоду"
              >
                <Icon name="trash" size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="section-head list-head">
        <h2>
          Карточки <span className="count">{filtered.length} из {cards.length}</span>
        </h2>
        <label className="search">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти карточку"
            aria-label="Поиск по карточкам"
          />
        </label>
      </div>

      {filtered.length === 0 && cards.length > 0 && (
        <div className="filter-bar">
          <button className="btn btn-ghost btn-small" onClick={() => setQuery('')}>
            <Icon name="x" size={14} /> Сбросить поиск
          </button>
        </div>
      )}

      {sortedTags.length > 0 && (
        <div className="filter-bar filter-bar--tags">
          <span className="filter-label">Теги:</span>
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
                Ещё {sortedTags.length - MAX_TAGS_COLLAPSED}
              </button>
            )}
            {sortedTags.length > MAX_TAGS_COLLAPSED && tagsExpanded && (
              <button
                type="button"
                className="tag-filter-btn tag-filter-less"
                onClick={() => setTagsExpanded(false)}
              >
                Свернуть
              </button>
            )}
          </div>
          {activeTags.size > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => setActiveTags(new Set())}
            >
              Очистить теги
            </button>
          )}
        </div>
      )}

      <div className="filter-bar filter-bar--status">
        <span className="filter-label">Статус:</span>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Все
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'new' ? 'active' : ''}`}
          onClick={() => setStatusFilter('new')}
        >
          Новые
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'due' ? 'active' : ''}`}
          onClick={() => setStatusFilter('due')}
        >
          К повторению
        </button>
        <button
          type="button"
          className={`status-filter-btn ${statusFilter === 'learned' ? 'active' : ''}`}
          onClick={() => setStatusFilter('learned')}
        >
          Изучённые
        </button>
      </div>

      {deck.builtin && (
        <p className="builtin-note">
          <Icon name="lock" size={14} /> Карточки встроенной колоды защищены от изменений — но прогресс
          можно сбросить.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="empty-note">
          {cards.length === 0
            ? 'В колоде пока нет карточек. Добавь первую!'
            : activeTags.size > 0 || statusFilter !== 'all' || query
              ? 'Ничего не нашлось по выбранным фильтрам. Попробуй сбросить фильтры.'
              : 'Ничего не нашлось. Попробуй другой запрос.'}
        </p>
      ) : (
        <div className="card-list">
          {filtered.map((card) => {
            const statusClass = !card.srs.introduced
              ? 'badge badge-soft'
              : card.srs.due <= now
                ? 'badge'
                : 'badge badge-muted'
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
                    {[card.reading, card.meaning].filter(Boolean).join('  ·  ') || '—'}
                  </div>
                  {card.note && <div className="row-note">{card.note}</div>}
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
                      title="Изменить"
                      aria-label="Изменить карточку"
                    >
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => setDeletingCard(card)}
                      title="Удалить"
                      aria-label="Удалить карточку"
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
          {cards.length} {plural(cards.length, 'карточка', 'карточки', 'карточек')} в колоде
        </p>
      )}

      {adding && <CardForm deckId={deck.id} onClose={() => setAdding(false)} />}
      {editingCard && (
        <CardForm deckId={deck.id} card={editingCard} onClose={() => setEditingCard(null)} />
      )}
      {editingDeck && <DeckForm deck={deck} onClose={() => setEditingDeck(false)} />}

      {deletingCard && (
        <ConfirmDialog
          title="Удалить карточку?"
          text={`«${deletingCard.front}» будет удалена вместе с её прогрессом. Это действие нельзя отменить.`}
          confirmLabel="Удалить"
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
          title="Удалить колоду?"
          text={`Колода «${deck.name}» и все её карточки будут удалены. Это действие нельзя отменить.`}
          confirmLabel="Удалить колоду"
          danger
          onClose={() => setDeletingDeck(false)}
          onConfirm={deleteDeck}
        />
      )}

      {resetting && (
        <ConfirmDialog
          title="Сбросить прогресс?"
          text="Все карточки этой колоды снова станут новыми. Общая история повторений и серия останутся."
          confirmLabel="Сбросить"
          onClose={() => setResetting(false)}
          onConfirm={resetDeck}
        />
      )}
    </div>
  )
}
