import { useCallback, useEffect, useRef, useState } from 'react'
import type { QueueItem, Rating, RatingUndo, StudyMode } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { intervalPreview } from '../lib/srs'
import { buildStudyQueue } from '../lib/study'
import { formatDuration, speakJa } from '../lib/utils'
import { FitText } from './FitText'
import { Icon } from './Icon'

const RATINGS: { rating: Rating; labelKey: string; key: string }[] = [
  { rating: 'again', labelKey: 'session.ratings.again', key: '1' },
  { rating: 'hard', labelKey: 'session.ratings.hard', key: '2' },
  { rating: 'good', labelKey: 'session.ratings.good', key: '3' },
  { rating: 'easy', labelKey: 'session.ratings.easy', key: '4' },
]

interface SessionProps {
  deckId: string
  items: QueueItem[]
  mode: StudyMode
  title?: string
  restartItems?: () => QueueItem[]
  onClose: () => void
}

interface SessionStats {
  reviews: number
  correct: number
  newCards: number
  startedAt: number
}

interface MistakeEntry {
  cardId: string
  count: number
}

interface SessionSnapshot {
  data: RatingUndo
  rating: Rating
  queue: QueueItem[]
  pos: number
  revealed: boolean
  finished: boolean
  stats: SessionStats
  mistakes: MistakeEntry[]
  shownAt: number
}

const RATING_LABEL_KEY: Record<Rating, string> = {
  again: 'session.ratings.again',
  hard: 'session.ratings.hard',
  good: 'session.ratings.good',
  easy: 'session.ratings.easy',
}

export function Session({ deckId, items, mode, title, restartItems, onClose }: SessionProps) {
  const { data, rateCard, undoRating, update } = useStore()
  const { t } = useI18n()
  const [queue, setQueue] = useState<QueueItem[]>(items)
  const [pos, setPos] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState<SessionStats>({
    reviews: 0,
    correct: 0,
    newCards: 0,
    startedAt: Date.now(),
  })
  const [lastRating, setLastRating] = useState<SessionSnapshot | null>(null)
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([])
  const [mnemonicOpen, setMnemonicOpen] = useState(false)
  const [mnemonicEditing, setMnemonicEditing] = useState(false)
  const [mnemonicDraft, setMnemonicDraft] = useState('')
  const [readingRevealed, setReadingRevealed] = useState(false)
  const shownAt = useRef(Date.now())

  const current = finished ? undefined : queue[pos]
  const card = current ? data.cards.find((item) => item.id === current.cardId) : undefined
  const cardDeck = card ? data.decks.find((item) => item.id === card.deckId) : undefined
  const canUseMnemonic = Boolean(cardDeck?.builtin)
  const mnemonic = card?.mnemonic?.trim() ?? ''
  const deck =
    deckId === 'all' ? undefined : data.decks.find((item) => item.id === deckId)
  const deckName = title
    ? title
    : deckId === 'all'
      ? t('common.allKana')
      : deck
        ? deckTitle(deck, t)
        : t('session.deckFallback')
  const total = Math.max(1, queue.length)
  const isKanji = cardDeck?.kind === 'kanji'
  const isWriting = mode === 'writing'
  const writingDifficulty = data.settings.writingDifficulty
  const hasMeaning = Boolean(card?.meaning.trim())
  const cardReading = card?.reading.trim() ?? ''
  const firstReading = isKanji
    ? card?.readings.find((item) => item.kana.trim() || item.transcription.trim())
    : undefined
  const readingKana = firstReading?.kana.trim() ?? ''
  const readingTranscription = firstReading?.transcription.trim() ?? ''
  const writingPrompt = isKanji
    ? readingKana || readingTranscription || card?.meaning.trim() || ''
    : hasMeaning
      ? card?.meaning.trim() ?? ''
      : cardReading
  const writingReading = isKanji
    ? readingKana && readingTranscription
      ? readingTranscription
      : ''
    : cardReading && cardReading !== writingPrompt
      ? cardReading
      : ''
  const showWritingReading =
    Boolean(writingReading) && (readingRevealed || writingDifficulty === 'normal')
  const speakText = isKanji && readingKana ? readingKana : card?.front ?? ''

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    setMnemonicOpen(false)
    setMnemonicEditing(false)
    setMnemonicDraft('')
    setReadingRevealed(false)
  }, [card?.id, pos])

  const openMnemonicEditor = () => {
    if (!card) return
    setMnemonicDraft(card.mnemonic ?? '')
    setMnemonicOpen(false)
    setMnemonicEditing(true)
  }

  const cancelMnemonicEditor = () => {
    setMnemonicEditing(false)
    setMnemonicDraft('')
  }

  const saveMnemonic = () => {
    if (!card) return
    const nextMnemonic = mnemonicDraft.trim()
    update((draft) => {
      const target = draft.cards.find((item) => item.id === card.id)
      if (target) target.mnemonic = nextMnemonic
    })
    setMnemonicDraft('')
    setMnemonicEditing(false)
    setMnemonicOpen(false)
  }

  const removeMnemonic = () => {
    if (!card) return
    update((draft) => {
      const target = draft.cards.find((item) => item.id === card.id)
      if (target) target.mnemonic = ''
    })
    setMnemonicDraft('')
    setMnemonicEditing(false)
    setMnemonicOpen(false)
  }

  const toggleMnemonic = () => {
    if (!card) return
    if (mnemonicOpen || mnemonicEditing) {
      setMnemonicOpen(false)
      setMnemonicEditing(false)
      setMnemonicDraft('')
      return
    }
    if (!mnemonic) {
      openMnemonicEditor()
      return
    }
    setMnemonicOpen(true)
  }

  const rate = useCallback(
    (rating: Rating) => {
      if (finished || !current || !card) return
      const elapsed = Date.now() - shownAt.current
      const ratingUndo = rateCard(card.id, rating, elapsed, mode)
      if (ratingUndo) {
        setLastRating({
          data: ratingUndo,
          rating,
          queue,
          pos,
          revealed,
          finished,
          stats,
          mistakes,
          shownAt: shownAt.current,
        })
      }
      if (rating === 'again') {
        setMistakes((prev) => {
          const existing = prev.find((entry) => entry.cardId === card.id)
          if (existing) {
            return prev.map((entry) =>
              entry.cardId === card.id ? { ...entry, count: entry.count + 1 } : entry,
            )
          }
          return [...prev, { cardId: card.id, count: 1 }]
        })
      }
      setStats((prev) => ({
        ...prev,
        reviews: prev.reviews + 1,
        correct: prev.correct + (rating === 'again' ? 0 : 1),
        newCards: prev.newCards + (current.isNew ? 1 : 0),
      }))

      let nextQueue = queue
      if (rating === 'again') {
        const at = Math.min(queue.length, pos + 4)
        nextQueue = [
          ...queue.slice(0, at),
          { cardId: card.id, isNew: false },
          ...queue.slice(at),
        ]
        setQueue(nextQueue)
      }

      if (pos + 1 >= nextQueue.length) {
        setFinished(true)
      } else {
        setPos(pos + 1)
        setRevealed(false)
        shownAt.current = Date.now()
      }
    },
    [card, current, finished, mistakes, mode, pos, queue, rateCard, revealed, stats],
  )

  const undoLastRating = useCallback(() => {
    if (!lastRating) return
    undoRating(lastRating.data)
    setQueue(lastRating.queue)
    setPos(lastRating.pos)
    setRevealed(lastRating.revealed)
    setFinished(lastRating.finished)
    setStats(lastRating.stats)
    setMistakes(lastRating.mistakes)
    shownAt.current = lastRating.shownAt
    setLastRating(null)
  }, [lastRating, undoRating])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.repeat) return
      if (event.key === 'Escape') {
        event.preventDefault()
        if (mnemonicEditing) {
          setMnemonicEditing(false)
          setMnemonicDraft('')
          return
        }
        if (mnemonicOpen) {
          setMnemonicOpen(false)
          return
        }
        onClose()
        return
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.code === 'KeyZ' || event.key.toLowerCase() === 'z')
      ) {
        if (!lastRating) return
        event.preventDefault()
        undoLastRating()
        return
      }
      if (finished) return
      if (event.key === ' ' || event.key === 'Enter') {
        if (target?.closest('button')) return
        event.preventDefault()
        setRevealed((prev) => !prev)
        return
      }
      if (!revealed) return
      const map: Record<string, Rating> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      }
      const rating = map[event.key]
      if (rating) {
        event.preventDefault()
        rate(rating)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    finished,
    lastRating,
    mnemonicEditing,
    mnemonicOpen,
    revealed,
    rate,
    undoLastRating,
    onClose,
  ])

  const restartQueue = finished
    ? restartItems
      ? restartItems()
      : buildStudyQueue(
          data.cards,
          data.decks,
          deckId,
          data.history,
          data.settings,
          Date.now(),
        )
    : []

  const restart = () => {
    if (!restartQueue.length) return
    setQueue(restartQueue)
    setPos(0)
    setRevealed(false)
    setFinished(false)
    setStats({ reviews: 0, correct: 0, newCards: 0, startedAt: Date.now() })
    setLastRating(null)
    setMistakes([])
    setReadingRevealed(false)
    shownAt.current = Date.now()
  }

  const mistakeRows = mistakes.flatMap((entry) => {
    const card = data.cards.find((item) => item.id === entry.cardId)
    if (!card) return []
    const deck = data.decks.find((item) => item.id === card.deckId)
    return [{ card, count: entry.count, isKanji: deck?.kind === 'kanji' }]
  })

  const practiceMistakes = () => {
    if (!mistakeRows.length) return
    setQueue(mistakeRows.map(({ card }) => ({ cardId: card.id, isNew: false })))
    setPos(0)
    setRevealed(false)
    setFinished(false)
    setStats({ reviews: 0, correct: 0, newCards: 0, startedAt: Date.now() })
    setLastRating(null)
    setMistakes([])
    setReadingRevealed(false)
    shownAt.current = Date.now()
  }

  const accuracy = stats.reviews ? Math.round((stats.correct / stats.reviews) * 100) : 0

  return (
    <div className="session">
      <header className="session-head">
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label={t('session.exit')}
          title={t('session.exitTitle')}
        >
          <Icon name="x" size={19} />
        </button>
        <div className="session-title">
          <span>{deckName}</span>
          <span className={`mode-badge ${mode}`}>
            {isWriting ? t('session.modeWriting') : t('session.modeReading')}
          </span>
          <span className="session-count">
            {finished ? queue.length : `${pos + 1} / ${queue.length}`}
          </span>
        </div>
        <div className="session-progress">
          <span style={{ width: `${finished ? 100 : Math.round((pos / total) * 100)}%` }} />
        </div>
      </header>

      {finished ? (
        <div className="session-done">
          <div className="done-jp" aria-hidden="true">
            できました
          </div>
          <div className="done-icon">
            <Icon name="sparkles" size={28} />
          </div>
          <h1>{t('session.doneTitle')}</h1>
          <p className="done-sub">{t('session.doneSub')}</p>

          <div className="done-stats">
            <div>
              <strong>{stats.reviews}</strong>
              <span>{t('session.cards')}</span>
            </div>
            <div>
              <strong>{accuracy}%</strong>
              <span>{t('session.accuracy')}</span>
            </div>
            <div>
              <strong>{stats.newCards}</strong>
              <span>{t('session.new')}</span>
            </div>
            <div>
              <strong>{formatDuration(Date.now() - stats.startedAt)}</strong>
              <span>{t('session.time')}</span>
            </div>
          </div>

          {mistakeRows.length > 0 && (
            <div className="mistake-review">
              <div className="mistake-head">
                <h2>{t('session.mistakesTitle')}</h2>
                <span className="badge badge-soft">{mistakeRows.length}</span>
              </div>
              <p className="mistake-sub">{t('session.mistakesSub')}</p>
              <div className="mistake-list">
                {mistakeRows.map(({ card: mistakeCard, count, isKanji: mistakeKanji }) => (
                  <div className="mistake-row" key={mistakeCard.id}>
                    <span className="mistake-front">{mistakeCard.front}</span>
                    <span className="mistake-meta">
                      {mistakeKanji ? (
                        mistakeCard.readings
                          .map((item) => item.kana)
                          .filter(Boolean)
                          .join('、') && (
                          <span className="mistake-reading">
                            {mistakeCard.readings
                              .map((item) => item.kana)
                              .filter(Boolean)
                              .join('、')}
                          </span>
                        )
                      ) : (
                        mistakeCard.reading && (
                          <span className="mistake-reading">{mistakeCard.reading}</span>
                        )
                      )}
                      {mistakeCard.meaning && (
                        <span className="mistake-meaning">{mistakeCard.meaning}</span>
                      )}
                    </span>
                    {count > 1 && <span className="mistake-count">×{count}</span>}
                    <button
                      type="button"
                      className="icon-btn mistake-say"
                      onClick={() =>
                        speakJa(
                          mistakeKanji && mistakeCard.readings[0]?.kana
                            ? mistakeCard.readings[0].kana
                            : mistakeCard.front,
                        )
                      }
                      title={t('session.listen')}
                      aria-label={t('session.listenAria', { front: mistakeCard.front })}
                    >
                      <Icon name="speaker" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="done-actions">
            {lastRating && (
              <button className="btn btn-ghost btn-lg" onClick={undoLastRating}>
                <Icon name="rotate" size={16} />
                {t('session.undo', { rating: t(RATING_LABEL_KEY[lastRating.rating]) })}
              </button>
            )}
            <button
              className={`btn btn-lg ${mistakeRows.length > 0 ? 'btn-ghost' : 'btn-primary'}`}
              onClick={onClose}
            >
              {t('session.doneButton')}
            </button>
            {mistakeRows.length > 0 && (
              <button className="btn btn-primary btn-lg" onClick={practiceMistakes}>
                <Icon name="rotate" size={16} />
                {t('session.practiceMistakes')}
              </button>
            )}
            {restartQueue.length > 0 && (
              <button className="btn btn-ghost btn-lg" onClick={restart}>
                {t('session.another')}
              </button>
            )}
          </div>
        </div>
      ) : card ? (
        <div className="session-body">
          <div className="flashcard-wrap">
            <div
              className={`flashcard${revealed ? ' flipped' : ''}`}
              onClick={() => setRevealed((prev) => !prev)}
            >
              <div className="face face-front">
                <div className="face-top">
                  <span className="face-deck">{deckName}</span>
                  <div className="face-top-right">
                    {current?.isNew && <span className="badge badge-soft">{t('session.newBadge')}</span>}
                    {canUseMnemonic && !isWriting && (
                      <button
                        type="button"
                        className={`icon-btn mnemonic-btn${mnemonic ? ' has-mnemonic' : ''}${
                          mnemonicOpen || mnemonicEditing ? ' active' : ''
                        }`}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleMnemonic()
                        }}
                        title={
                          !mnemonic
                            ? t('session.mnemonicAdd')
                            : mnemonicOpen || mnemonicEditing
                              ? t('session.mnemonicHide')
                              : t('session.mnemonicShow')
                        }
                        aria-label={
                          !mnemonic
                            ? t('session.mnemonicAdd')
                            : mnemonicOpen || mnemonicEditing
                              ? t('session.mnemonicHide')
                              : t('session.mnemonicShow')
                        }
                        aria-expanded={mnemonicOpen || mnemonicEditing}
                      >
                        <Icon name={mnemonic ? 'bulb' : 'plus'} size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {isWriting ? (
                  <div className="writing-prompt">
                    <span className="writing-instruction">
                      {isKanji
                        ? t('session.writeKanji')
                        : hasMeaning
                          ? t('session.writeJapanese')
                          : cardReading
                            ? t('session.writeKana')
                            : t('session.noHint')}
                    </span>
                    {writingPrompt ? (
                      <div className="writing-word">{writingPrompt}</div>
                    ) : (
                      <div className="writing-empty">
                        {isKanji ? t('session.noKanjiReading') : t('session.noCardReading')}
                      </div>
                    )}
                    {showWritingReading && (
                      <div className="writing-reading">{writingReading}</div>
                    )}
                    {!showWritingReading && writingReading && (
                      <button
                        type="button"
                        className="writing-reveal"
                        onClick={(event) => {
                          event.stopPropagation()
                          setReadingRevealed(true)
                        }}
                      >
                        <Icon name="bulb" size={15} />
                        {t('session.showTranscription')}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <FitText
                      className={`kana-front${isKanji ? ' kanji-front' : ''}`}
                      text={card.front}
                      maxFontSize={150}
                      minFontSize={18}
                    />

                    {canUseMnemonic && (mnemonicEditing || mnemonicOpen) && (
                      <div className="mnemonic-panel" onClick={(event) => event.stopPropagation()}>
                        {mnemonicEditing ? (
                          <form
                            className="mnemonic-form"
                            onSubmit={(event) => {
                              event.preventDefault()
                              saveMnemonic()
                            }}
                          >
                            <label className="mnemonic-label" htmlFor={`mnemonic-${card.id}`}>
                              {t('session.mnemonicLabel')}
                            </label>
                            <textarea
                              id={`mnemonic-${card.id}`}
                              className="mnemonic-input"
                              value={mnemonicDraft}
                              onChange={(event) => setMnemonicDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  cancelMnemonicEditor()
                                }
                                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                                  event.preventDefault()
                                  saveMnemonic()
                                }
                              }}
                              placeholder={t('session.mnemonicPlaceholder')}
                              rows={2}
                              maxLength={240}
                              autoFocus
                            />
                            <div className="mnemonic-actions">
                              {mnemonic && (
                                <button
                                  type="button"
                                  className="btn btn-danger-ghost btn-small"
                                  onClick={removeMnemonic}
                                >
                                  {t('common.delete')}
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-ghost btn-small"
                                onClick={cancelMnemonicEditor}
                              >
                                {t('common.cancel')}
                              </button>
                              <button type="submit" className="btn btn-primary btn-small">
                                {t('common.save')}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="mnemonic-view">
                            <p className="mnemonic-text">{mnemonic}</p>
                            <button
                              type="button"
                              className="icon-btn mnemonic-edit-btn"
                              onClick={openMnemonicEditor}
                              title={t('session.mnemonicEdit')}
                              aria-label={t('session.mnemonicEdit')}
                            >
                              <Icon name="pencil" size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="face-bottom">
                  {!isWriting && (
                    <button
                      className="icon-btn speak"
                      onClick={(event) => {
                        event.stopPropagation()
                        speakJa(speakText)
                      }}
                      title={t('session.listen')}
                      aria-label={t('session.listen')}
                    >
                      <Icon name="speaker" size={19} />
                    </button>
                  )}
                  <span className="face-hint">
                    {isWriting ? t('session.checkYourself') : t('session.flipHint')}
                  </span>
                </div>
              </div>

              <div className="face face-back">
                <div className="face-top">
                  <span className="face-deck">{t('session.answer')}</span>
                  {!isWriting && <span className="face-jp-small">{card.front}</span>}
                </div>
                {isKanji ? (
                  <div className={`answer kanji-answer${isWriting ? ' answer-writing' : ''}`}>
                    {isWriting && (
                      <FitText
                        className="answer-jp"
                        text={card.front}
                        maxFontSize={110}
                        minFontSize={20}
                      />
                    )}
                    {card.meaning && <div className="answer-meaning">{card.meaning}</div>}
                    {card.readings.length > 0 && (
                      <div className="kanji-readings">
                        {card.readings.map((item) => (
                          <div className="kanji-reading" key={item.id}>
                            {item.kana && (
                              <span className="kanji-reading-kana">{item.kana}</span>
                            )}
                            {item.transcription && (
                              <span className="kanji-reading-transcription">
                                {item.transcription}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {card.examples.length > 0 && (
                      <div className="kanji-usages">
                        <div className="kanji-usage-label">{t('session.examples')}</div>
                        {card.examples.map((item) => (
                          <div className="kanji-usage" key={item.id}>
                            <div className="kanji-usage-jp">
                              {item.text}
                              {item.transcription && (
                                <span className="kanji-usage-transcription">
                                  {item.transcription}
                                </span>
                              )}
                            </div>
                            {item.translation && (
                              <div className="kanji-usage-translation">{item.translation}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {card.note && <p className="answer-note">{card.note}</p>}
                    {!isWriting &&
                      !card.meaning &&
                      card.readings.length === 0 &&
                      card.examples.length === 0 &&
                      !card.note && <div className="answer-meaning">{card.front}</div>}
                  </div>
                ) : (
                  <div className={`answer${isWriting ? ' answer-writing' : ''}`}>
                    {isWriting && (
                      <FitText
                        className="answer-jp"
                        text={card.front}
                        maxFontSize={110}
                        minFontSize={20}
                      />
                    )}
                    {card.reading && <div className="answer-reading">{card.reading}</div>}
                    {card.meaning && <div className="answer-meaning">{card.meaning}</div>}
                    {card.note && <p className="answer-note">{card.note}</p>}
                    {!isWriting && !card.reading && !card.meaning && !card.note && (
                      <div className="answer-meaning">{card.front}</div>
                    )}
                  </div>
                )}
                <div className="face-bottom">
                  <button
                    className="icon-btn speak"
                    onClick={(event) => {
                      event.stopPropagation()
                      speakJa(speakText)
                    }}
                    title={t('session.listen')}
                    aria-label={t('session.listen')}
                  >
                    <Icon name="speaker" size={19} />
                  </button>
                  <span className="face-hint">{t('session.flipBack')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="session-actions">
            <div className="session-actions-main">
              {revealed ? (
                <div className="rating-row">
                  {RATINGS.map((item) => (
                    <button
                      key={item.rating}
                      className={`rate-btn rate-${item.rating}`}
                      onClick={() => rate(item.rating)}
                    >
                      <span className="rate-top">
                        <b>{t(item.labelKey)}</b>
                        <kbd>{item.key}</kbd>
                      </span>
                      <span className="rate-interval">
                        {intervalPreview(card.srs, item.rating)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-lg show-answer"
                  onClick={() => setRevealed(true)}
                >
                  {t('session.showAnswer')}
                  <kbd>{t('session.space')}</kbd>
                </button>
              )}
            </div>

            <div className="undo-slot">
              {lastRating && (
                <button
                  className="undo-rating"
                  onClick={undoLastRating}
                  title={t('session.undoTitle')}
                >
                  <Icon name="rotate" size={13} />
                  {t('session.undo', { rating: t(RATING_LABEL_KEY[lastRating.rating]) })}
                  <kbd>Ctrl Z</kbd>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="session-done">
          <h1>{t('session.cardsDone')}</h1>
          <button className="btn btn-primary" onClick={onClose}>
            {t('session.doneButton')}
          </button>
        </div>
      )}
    </div>
  )
}
