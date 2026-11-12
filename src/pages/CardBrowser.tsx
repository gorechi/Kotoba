import { useEffect, useRef, useState, type DragEvent } from 'react'
import type { Card, DeckKind } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { cardExampleTranslation, cardMeaning, deckTitle, isProtectedDeck } from '../lib/content'
import { freshSrs, knownSrs } from '../lib/srs'
import { dueLabel, formatDate } from '../lib/utils'
import { speakJa } from '../lib/tts'
import { Icon } from '../components/Icon'
import { ConfirmDialog, Modal } from '../components/Modal'
import { Select } from '../components/Select'
import {
  MAX_TAGS_COLLAPSED,
  PAGE_SIZE,
  SORT_OPTIONS,
  STATUS_FILTERS,
  STATUS_LABEL_KEY,
  cardStatus,
  type SortKey,
  type TypeFilter,
} from '../lib/card-browser'
import { useCardBrowserFilters } from './card-browser/useCardBrowserFilters'

interface CardBrowserProps {
  focusCardId?: string
  initialQuery?: string
}

export function CardBrowser({ focusCardId, initialQuery }: CardBrowserProps) {
  const { data, update } = useStore()
  const { t, locale } = useI18n()
  const now = Date.now()

  const {
    query,
    setQuery,
    deckFilter,
    setDeckFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    mnemonicOnly,
    setMnemonicOnly,
    activeTags,
    setActiveTags,
    tagsExpanded,
    setTagsExpanded,
    sort,
    setSort,
    deckMap,
    deckCounts,
    allTags,
    filtered,
    visibleCards,
    visibleTags,
    setVisibleCount,
  } = useCardBrowserFilters(data.cards, data.decks, t, locale.intl)

  useEffect(() => {
    if (initialQuery !== undefined) setQuery(initialQuery)
  }, [initialQuery, setQuery])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<Card | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [draggingIds, setDraggingIds] = useState<string[]>([])
  const [dragOverDeck, setDragOverDeck] = useState<string | null>(null)
  const openedFocusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!focusCardId || openedFocusRef.current === focusCardId) return
    const target = data.cards.find((card) => card.id === focusCardId)
    if (!target) return
    openedFocusRef.current = focusCardId
    setPreview(target)
  }, [data.cards, focusCardId])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const isProtectedCard = (card: Card) => {
    const deck = deckMap.get(card.deckId)
    return deck ? isProtectedDeck(deck) : false
  }

  const movableDecks = data.decks.filter((deck) => !isProtectedDeck(deck))

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((card) => selected.has(card.id))
  const selectedCards = data.cards.filter((card) => selected.has(card.id))
  const allSelectedSuspended =
    selectedCards.length > 0 && selectedCards.every((card) => card.suspended)
  const selectionHasProtected = selectedCards.some((card) => isProtectedCard(card))

  const selectedKinds = new Set<DeckKind>()
  for (const card of selectedCards) {
    const deck = deckMap.get(card.deckId)
    if (deck) selectedKinds.add(deck.kind)
  }
  const selectedKind = selectedKinds.size === 1 ? [...selectedKinds][0] : null
  const moveTargetDecks = selectedKind
    ? movableDecks.filter((deck) => deck.kind === selectedKind)
    : []

  const draggingCards = draggingIds.length
    ? data.cards.filter((card) => draggingIds.includes(card.id))
    : []
  const draggingKinds = new Set<DeckKind>()
  for (const card of draggingCards) {
    const deck = deckMap.get(card.deckId)
    if (deck) draggingKinds.add(deck.kind)
  }
  const draggingKind = draggingKinds.size === 1 ? [...draggingKinds][0] : null

  const toggleSelect = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        for (const card of filtered) next.delete(card.id)
      } else {
        for (const card of filtered) next.add(card.id)
      }
      return next
    })
  }

  const clearFilters = () => {
    setQuery('')
    setDeckFilter('all')
    setTypeFilter('all')
    setStatusFilter('all')
    setMnemonicOnly(false)
    setActiveTags(new Set())
    setTagsExpanded(false)
  }

  const moveCards = (ids: string[], targetDeckId: string) => {
    const targetDeck = deckMap.get(targetDeckId)
    if (!targetDeck || isProtectedDeck(targetDeck)) return
    const idSet = new Set(ids)
    const protectedIds = new Set(
      data.cards.filter((card) => isProtectedCard(card)).map((card) => card.id),
    )
    if (ids.some((id) => protectedIds.has(id))) return

    const sourceKinds = new Set<DeckKind>()
    for (const card of data.cards) {
      if (!idSet.has(card.id)) continue
      const deck = deckMap.get(card.deckId)
      if (deck) sourceKinds.add(deck.kind)
    }
    if (sourceKinds.size !== 1 || !sourceKinds.has(targetDeck.kind)) {
      setNotice(t('browser.noticeWrongDeckKind'))
      return
    }

    const moved = data.cards.filter(
      (card) => idSet.has(card.id) && card.deckId !== targetDeckId,
    ).length
    if (moved === 0) {
      setSelected(new Set())
      return
    }

    update((current) => {
      let nextOrder =
        current.cards
          .filter((card) => card.deckId === targetDeckId)
          .reduce((max, card) => Math.max(max, card.order), 0) + 1
      return {
        ...current,
        cards: current.cards.map((card) => {
          if (!idSet.has(card.id) || card.deckId === targetDeckId) return card
          const movedCard = { ...card, deckId: targetDeckId, order: nextOrder }
          nextOrder += 1
          return movedCard
        }),
      }
    })

    setSelected(new Set())
    setNotice(t('browser.noticeMoved', { n: moved }))
  }

  const setSuspended = (suspended: boolean) => {
    if (selected.size === 0 || selectionHasProtected) return
    const count = selected.size
    update((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        selected.has(card.id) ? { ...card, suspended } : card,
      ),
    }))
    setNotice(
      t(suspended ? 'browser.noticeSuspended' : 'browser.noticeUnsuspended', {
        n: count,
      }),
    )
    setSelected(new Set())
  }

  const markKnown = () => {
    if (selected.size === 0) return
    const count = selected.size
    const known = knownSrs()
    update((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        selected.has(card.id) ? { ...card, srs: { ...known } } : card,
      ),
    }))
    setNotice(t('browser.noticeKnown', { n: count }))
    setSelected(new Set())
  }

  const resetSelectedProgress = () => {
    if (selected.size === 0) return
    const count = selected.size
    update((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        selected.has(card.id) ? { ...card, srs: freshSrs() } : card,
      ),
    }))
    setNotice(t('browser.noticeReset', { n: count }))
    setSelected(new Set())
  }

  const addTag = () => {
    if (selectionHasProtected) return
    const tag = tagDraft.trim()
    if (!tag) {
      setNotice(t('browser.noticeEmptyTag'))
      return
    }
    if (selected.size === 0) return
    const count = selected.size
    update((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        selected.has(card.id) && !card.tags.includes(tag)
          ? { ...card, tags: [...card.tags, tag] }
          : card,
      ),
    }))
    setTagDraft('')
    setNotice(t('browser.noticeTagged', { n: count }))
    setSelected(new Set())
  }

  const deleteSelected = () => {
    if (selectionHasProtected) return
    const count = selected.size
    if (count === 0) return
    update((current) => ({
      ...current,
      cards: current.cards.filter((card) => !selected.has(card.id)),
    }))
    setSelected(new Set())
    setPendingDelete(false)
    setNotice(t('browser.noticeDeleted', { n: count }))
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, card: Card) => {
    if (selectionHasProtected || isProtectedCard(card)) return
    const ids = selected.has(card.id) ? [...selected] : [card.id]
    const idSet = new Set(ids)
    const kinds = new Set<DeckKind>()
    for (const item of data.cards) {
      if (!idSet.has(item.id)) continue
      const deck = deckMap.get(item.deckId)
      if (deck) kinds.add(deck.kind)
    }
    if (kinds.size > 1) {
      event.preventDefault()
      setNotice(t('browser.noticeMixedKinds'))
      return
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', ids.join(','))
    setDraggingIds(ids)
  }

  const handleDrop = (event: DragEvent<HTMLButtonElement>, deckId: string) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('text/plain')
    const ids = raw ? raw.split(',') : draggingIds
    if (ids.length) moveCards(ids, deckId)
    setDraggingIds([])
    setDragOverDeck(null)
  }

  const clearSelection = () => setSelected(new Set())
  const activeFilters =
    query.trim() !== '' ||
    deckFilter !== 'all' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    mnemonicOnly ||
    activeTags.size > 0

  return (
    <div className="page card-browser">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('browser.eyebrow')}</div>
          <h1>{t('browser.title')}</h1>
          <p className="page-sub">{t('browser.subtitle')}</p>
        </div>
        <span className="chart-total">{t('browser.total', { n: data.cards.length })}</span>
      </header>

      <div className={`browser-layout${draggingIds.length > 0 ? ' is-dragging' : ''}`}>
        <aside className="panel browser-decks">
          <div className="browser-decks-head">
            <h2>{t('browser.decks')}</h2>
            <p>{t('browser.dropHint')}</p>
          </div>

          <button
            type="button"
            className={`browser-deck-item${deckFilter === 'all' ? ' active' : ''}`}
            onClick={() => setDeckFilter('all')}
          >
            <span className="browser-deck-icon">
              <Icon name="layers" size={15} />
            </span>
            <span className="browser-deck-name">{t('browser.allCards')}</span>
            <span className="browser-deck-count">{data.cards.length}</span>
          </button>

          {data.decks.map((deck) => {
            const protectedDeck = isProtectedDeck(deck)
            const dropEnabled =
              !protectedDeck && draggingKind !== null && deck.kind === draggingKind
            const dropDisabled = draggingIds.length > 0 && !dropEnabled
            const wrongKind =
              draggingIds.length > 0 && draggingKind !== null && deck.kind !== draggingKind
            return (
              <button
                type="button"
                key={deck.id}
                className={`browser-deck-item${deckFilter === deck.id ? ' active' : ''}${
                  dragOverDeck === deck.id ? ' is-drop-target' : ''
                }${protectedDeck ? ' is-protected' : ''}${
                  dropDisabled ? ' is-drop-disabled' : ''
                }`}
                data-deck-id={deck.id}
                title={
                  protectedDeck
                    ? t('browser.protectedDeck')
                    : wrongKind
                      ? t('browser.dropWrongKind')
                      : undefined
                }
                onClick={() => setDeckFilter(deck.id)}
                onDragOver={
                  dropEnabled
                    ? (event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                        setDragOverDeck(deck.id)
                      }
                    : undefined
                }
                onDragLeave={
                  dropEnabled
                    ? (event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                          setDragOverDeck(null)
                        }
                      }
                    : undefined
                }
                onDrop={dropEnabled ? (event) => handleDrop(event, deck.id) : undefined}
              >
                <span className="deck-dot" style={{ background: deck.accent }} />
                <span className="browser-deck-name">{deckTitle(deck, t)}</span>
                {protectedDeck && (
                  <Icon name="lock" size={11} className="browser-deck-lock" />
                )}
                <span className="browser-deck-count">
                  {dragOverDeck === deck.id
                    ? t('browser.dropHere')
                    : (deckCounts.get(deck.id) ?? 0)}
                </span>
              </button>
            )
          })}
        </aside>

        <div className="browser-main">
          <section className="panel browser-toolbar">
            <div className="browser-search-row">
              <div className="browser-search">
                <Icon name="search" size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('browser.searchPlaceholder')}
                  aria-label={t('browser.searchAria')}
                  type="search"
                />
              </div>

              <label className="browser-select-field">
                <span>{t('browser.deck')}</span>
                <Select value={deckFilter} onChange={(event) => setDeckFilter(event.target.value)}>
                  <option value="all">{t('browser.allDecks')}</option>
                  {data.decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deckTitle(deck, t)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="browser-select-field">
                <span>{t('browser.type')}</span>
                <Select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                >
                  <option value="all">{t('browser.allTypes')}</option>
                  <option value="kana">{t('browser.typeKana')}</option>
                  <option value="kanji">{t('browser.typeKanji')}</option>
                </Select>
              </label>

              <label className="browser-select-field">
                <span>{t('browser.sort')}</span>
                <Select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <div className="filter-bar filter-bar--status">
              <span className="filter-label">{t('browser.status')}</span>
              {STATUS_FILTERS.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={`status-filter-btn${statusFilter === item.value ? ' active' : ''}`}
                  onClick={() => setStatusFilter(item.value)}
                >
                  {t(item.labelKey)}
                </button>
              ))}
              <button
                type="button"
                className={`status-filter-btn${mnemonicOnly ? ' active' : ''}`}
                onClick={() => setMnemonicOnly((value) => !value)}
              >
                <Icon name="bulb" size={13} /> {t('browser.withMnemonic')}
              </button>
              {activeFilters && (
                <button type="button" className="btn btn-ghost btn-small" onClick={clearFilters}>
                  {t('browser.clearFilters')}
                </button>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="filter-bar filter-bar--tags">
                <span className="filter-label">{t('browser.tags')}</span>
                <div className={`tag-filter-wrap${tagsExpanded ? ' expanded' : ''}`}>
                  {visibleTags.map(([tag]) => (
                    <button
                      type="button"
                      key={tag}
                      className={`tag-filter-btn${activeTags.has(tag) ? ' active' : ''}`}
                      onClick={() => {
                        setActiveTags((current) => {
                          const next = new Set(current)
                          if (next.has(tag)) next.delete(tag)
                          else next.add(tag)
                          return next
                        })
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                  {allTags.length > MAX_TAGS_COLLAPSED && (
                    <button
                      type="button"
                      className={`tag-filter-btn${
                        tagsExpanded ? ' tag-filter-less' : ' tag-filter-more'
                      }`}
                      onClick={() => setTagsExpanded((value) => !value)}
                    >
                      {tagsExpanded
                        ? t('deckDetail.collapse')
                        : t('deckDetail.moreTags', {
                            n: allTags.length - MAX_TAGS_COLLAPSED,
                          })}
                    </button>
                  )}
                </div>
              </div>
            )}

            {notice && (
              <div className="notice">
                <Icon name="check" size={14} />
                {notice}
              </div>
            )}
          </section>

            {selected.size > 0 && (
              <div className={`browser-bulk${selectionHasProtected ? ' is-locked' : ''}`}>
                <div className="browser-bulk-info">
                  <strong>{t('browser.selected', { n: selected.size })}</strong>
                  {selectionHasProtected && (
                    <span className="browser-bulk-lock">
                      <Icon name="lock" size={12} />
                      {t('browser.builtinLocked')}
                    </span>
                  )}
                </div>
                <div className="browser-bulk-actions">
                  <div className="browser-bulk-select">
                    <Select
                      aria-label={t('browser.moveTo')}
                      value=""
                      disabled={selectionHasProtected || moveTargetDecks.length === 0}
                      title={
                        !selectionHasProtected &&
                        selectedKind === null &&
                        selectedCards.length > 1
                          ? t('browser.noticeMixedKinds')
                          : undefined
                      }
                      onChange={(event) => {
                        if (event.target.value) moveCards([...selected], event.target.value)
                      }}
                    >
                      <option value="" disabled>
                        {t('browser.moveTo')}
                      </option>
                      {moveTargetDecks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          {deckTitle(deck, t)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="browser-tag-add">
                    <input
                      value={tagDraft}
                      onChange={(event) => setTagDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') addTag()
                      }}
                      placeholder={t('browser.tagPlaceholder')}
                      aria-label={t('browser.addTag')}
                      disabled={selectionHasProtected}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={addTag}
                      disabled={selectionHasProtected}
                    >
                      {t('browser.add')}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => setSuspended(!allSelectedSuspended)}
                    disabled={selectionHasProtected}
                  >
                    <Icon name="lock" size={14} />
                    {allSelectedSuspended ? t('browser.unsuspend') : t('browser.suspend')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={markKnown}
                  >
                    <Icon name="check" size={14} />
                    {t('browser.markKnown')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={resetSelectedProgress}
                  >
                    <Icon name="rotate" size={14} />
                    {t('browser.resetProgress')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger-ghost btn-small"
                    onClick={() => setPendingDelete(true)}
                    disabled={selectionHasProtected}
                  >
                    <Icon name="trash" size={14} />
                    {t('browser.delete')}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={clearSelection}
                  >
                    {t('browser.clearSelection')}
                  </button>
                </div>
              </div>
            )}

          <section className="panel browser-list-panel">
            <div className="browser-list-head">
              <label className="browser-select-all">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                />
                <span>{t('browser.selectAll')}</span>
              </label>
              <span className="chart-total">{t('browser.found', { n: filtered.length })}</span>
            </div>

            {filtered.length === 0 ? (
              <p className="empty-note">
                {data.cards.length === 0 ? t('browser.emptyAll') : t('browser.empty')}
              </p>
            ) : (
              <>
                <div className="browser-rows">
                  {visibleCards.map((card) => {
                  const deck = deckMap.get(card.deckId)
                  const status = cardStatus(card, now)
                  const protectedCard = isProtectedCard(card)
                  const canDrag = !protectedCard && !selectionHasProtected
                  return (
                    <div
                      className={`browser-row${selected.has(card.id) ? ' is-selected' : ''}${
                        canDrag ? '' : ' is-locked'
                      }`}
                      key={card.id}
                      data-card-id={card.id}
                      draggable={canDrag}
                      onDragStart={(event) => handleDragStart(event, card)}
                      onDragEnd={() => {
                        setDraggingIds([])
                        setDragOverDeck(null)
                      }}
                    >
                      <span
                        className={`browser-drag-handle${
                          protectedCard ? ' browser-drag-handle--locked' : ''
                        }${!canDrag && !protectedCard ? ' browser-drag-handle--muted' : ''}`}
                        title={protectedCard ? t('browser.protectedCard') : undefined}
                        aria-hidden={protectedCard ? undefined : true}
                      >
                        {protectedCard ? <Icon name="lock" size={11} /> : '⋮⋮'}
                      </span>
                      <input
                        type="checkbox"
                        className="browser-row-check"
                        checked={selected.has(card.id)}
                        onChange={() => toggleSelect(card.id)}
                        aria-label={card.front}
                      />

                      <div className="browser-row-main">
                        <div className="browser-row-top">
                          <strong className="browser-front">{card.front}</strong>
                          <span className={`browser-status browser-status--${status}`}>
                            {t(STATUS_LABEL_KEY[status])}
                          </span>
                          {card.suspended && (
                            <span className="browser-suspended">
                              {t('browser.suspendedBadge')}
                            </span>
                          )}
                        </div>
                        <div className="browser-row-meta">
                          {card.reading && <span>{card.reading}</span>}
                          {cardMeaning(card, t) && <span>{cardMeaning(card, t)}</span>}
                          {deck && (
                            <span className="browser-row-deck">
                              <i style={{ background: deck.accent }} />
                              {deckTitle(deck, t)}
                            </span>
                          )}
                          {card.mnemonic.trim() && (
                            <Icon name="bulb" size={12} className="browser-mnemonic" />
                          )}
                        </div>
                        {card.tags.length > 0 && (
                          <div className="browser-row-tags">
                            {card.tags.map((tag) => (
                              <span className="browser-tag" key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="browser-row-side">
                        {card.srs.introduced && (
                          <span title={t('browser.interval')}>
                            {Math.round(card.srs.interval)} {t('browser.daysShort')}
                          </span>
                        )}
                        {card.srs.lapses > 0 && (
                          <span className="browser-lapses" title={t('browser.lapses')}>
                            ×{card.srs.lapses}
                          </span>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setPreview(card)}
                          title={t('browser.preview')}
                          aria-label={`${t('browser.preview')}: ${card.front}`}
                        >
                          <Icon name="eye" size={16} />
                        </button>
                      </div>
                    </div>
                  )
                  })}
                </div>
                {filtered.length > visibleCards.length && (
                  <div className="browser-show-more">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    >
                      {t('browser.showMore', { n: filtered.length - visibleCards.length })}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {preview && (
        <Modal
          title={t('browser.previewTitle')}
          subtitle={
            deckMap.get(preview.deckId)
              ? deckTitle(deckMap.get(preview.deckId)!, t)
              : undefined
          }
          onClose={() => setPreview(null)}
          footer={
            <button className="btn btn-ghost" onClick={() => setPreview(null)}>
              {t('common.close')}
            </button>
          }
        >
          <div className="browser-preview">
            <div className="browser-preview-front">
              <span className="kana-char">{preview.front}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => speakJa(preview.readings[0]?.kana || preview.front)}
                aria-label={t('session.listen')}
                title={t('session.listen')}
              >
                <Icon name="speaker" size={17} />
              </button>
            </div>

            <div className="browser-preview-grid">
              <div>
                <span>{t('browser.reading')}</span>
                <strong>{preview.reading || t('browser.noValue')}</strong>
              </div>
              <div>
                <span>{t('browser.meaning')}</span>
                <strong>{cardMeaning(preview, t) || t('browser.noValue')}</strong>
              </div>
              <div>
                <span>{t('browser.status')}</span>
                <strong>{t(STATUS_LABEL_KEY[cardStatus(preview, now)])}</strong>
              </div>
              <div>
                <span>{t('browser.interval')}</span>
                <strong>
                  {preview.srs.introduced
                    ? `${Math.round(preview.srs.interval)} ${t('browser.daysShort')}`
                    : t('browser.noValue')}
                </strong>
              </div>
              <div>
                <span>{t('browser.due')}</span>
                <strong>{dueLabel(preview.srs.due, preview.srs.introduced)}</strong>
              </div>
              <div>
                <span>{t('browser.lapses')}</span>
                <strong>{preview.srs.lapses}</strong>
              </div>
              <div>
                <span>{t('cardForm.jlpt')}</span>
                <strong>{preview.jlpt ? `N${preview.jlpt}` : t('browser.noValue')}</strong>
              </div>
              <div>
                <span>{t('cardForm.frequency')}</span>
                <strong>{preview.frequency ?? t('browser.noValue')}</strong>
              </div>
              <div>
                <span>{t('browser.created')}</span>
                <strong>{formatDate(preview.createdAt)}</strong>
              </div>
            </div>

            {preview.note && (
              <div className="browser-preview-section">
                <span>{t('browser.note')}</span>
                <p>{preview.note}</p>
              </div>
            )}
            {preview.mnemonic && (
              <div className="browser-preview-section">
                <span>{t('browser.mnemonic')}</span>
                <p>{preview.mnemonic}</p>
              </div>
            )}
            {preview.tags.length > 0 && (
              <div className="browser-preview-section">
                <span>{t('browser.tags')}</span>
                <div className="browser-preview-tags">
                  {preview.tags.map((tag) => (
                    <span className="browser-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {preview.readings.length > 0 && (
              <div className="browser-preview-section">
                <span>{t('browser.readings')}</span>
                <ul>
                  {preview.readings.map((item) => (
                    <li key={item.id}>
                      {item.kana}
                      {item.transcription ? ` — ${item.transcription}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {preview.examples.length > 0 && (
              <div className="browser-preview-section">
                <span>{t('browser.examples')}</span>
                <ul>
                  {preview.examples.map((item) => {
                    const translation = cardExampleTranslation(preview, item, t)
                    return (
                      <li key={item.id}>
                        {item.text}
                        {item.transcription ? ` — ${item.transcription}` : ''}
                        {translation ? ` — ${translation}` : ''}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t('browser.deleteTitle')}
          text={t('browser.deleteText', { n: selected.size })}
          confirmLabel={t('browser.delete')}
          danger
          onClose={() => setPendingDelete(false)}
          onConfirm={deleteSelected}
        />
      )}
    </div>
  )
}
