import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Card } from '../types'
import { useStore } from '../state/store'
import { freshSrs } from '../lib/srs'
import { finalizeRomajiTail, guessKanaMode, suggestReading, type KanaMode } from '../lib/romaji'
import { uid } from '../lib/utils'
import { FitText } from './FitText'
import { KanaInput } from './KanaInput'
import { Modal } from './Modal'

interface CardFormProps {
  deckId: string
  card?: Card | null
  onClose: () => void
}

export function CardForm({ deckId, card, onClose }: CardFormProps) {
  const { data, update } = useStore()
  const deck = data.decks.find((item) => item.id === deckId)
  const deckTags = useMemo(() => {
    const set = new Set<string>()
    data.cards
      .filter((c) => c.deckId === deckId)
      .forEach((c) => c.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [data.cards, deckId])

  const [front, setFront] = useState(card?.front ?? '')
  const [reading, setReading] = useState(card?.reading ?? '')
  const [meaning, setMeaning] = useState(card?.meaning ?? '')
  const [note, setNote] = useState(card?.note ?? '')
  const [tags, setTags] = useState<string[]>(card?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [frontMode, setFrontMode] = useState<KanaMode>(() => guessKanaMode(card?.front, 'hiragana'))
  const [readingMode, setReadingMode] = useState<KanaMode>(() => guessKanaMode(card?.reading, 'abc'))
  const [readingTouched, setReadingTouched] = useState(Boolean(card?.reading))
  const [error, setError] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = tagInput.trim().toLowerCase()
    if (!input) {
      setTagSuggestions([])
      return
    }
    setTagSuggestions(
      deckTags.filter((t) => t.toLowerCase().includes(input) && !tags.includes(t)),
    )
  }, [tagInput, deckTags, tags])

  const changeFront = (value: string) => {
    setFront(value)
    setError('')
    if (!readingTouched) setReading(suggestReading(value))
  }

  const changeReading = (value: string) => {
    setReading(value)
    setReadingTouched(true)
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed)) return
    setTags([...tags, trimmed])
    setTagInput('')
    setTagSuggestions([])
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const selectSuggestion = (tag: string) => {
    addTag(tag)
  }

  const save = (keepOpen: boolean) => {
    const cleanFront = finalizeRomajiTail(front, frontMode).trim()
    if (!cleanFront) {
      setError('Добавь японское слово или знак')
      frontRef.current?.focus()
      return
    }
    const cleanReading = finalizeRomajiTail(reading, readingMode).trim()
    update((draft) => {
      if (card) {
        const target = draft.cards.find((item) => item.id === card.id)
        if (target) {
          target.front = cleanFront
          target.reading = cleanReading
          target.meaning = meaning.trim()
          target.note = note.trim()
          target.tags = tags
        }
        return
      }
      const maxOrder = draft.cards.reduce(
        (max, item) => (item.deckId === deckId ? Math.max(max, item.order) : max),
        0,
      )
      draft.cards.push({
        id: uid('card'),
        deckId,
        front: cleanFront,
        reading: cleanReading,
        meaning: meaning.trim(),
        note: note.trim(),
        mnemonic: '',
        tags,
        group: 'custom',
        order: maxOrder + 1,
        srs: freshSrs(),
        createdAt: Date.now(),
      })
    })

    if (!keepOpen) {
      onClose()
      return
    }

    setFront('')
    setReading('')
    setMeaning('')
    setNote('')
    setError('')
    setReadingTouched(false)
    window.requestAnimationFrame(() => frontRef.current?.focus())
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      save(!card)
    }
  }

  return (
    <Modal
      title={card ? 'Изменить карточку' : 'Новая карточка'}
      subtitle={deck ? `Колода «${deck.name}»` : undefined}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          {!card && (
            <button
              type="button"
              className="btn btn-ghost"
              title="Ctrl+Enter"
              onClick={() => save(true)}
            >
              Добавить и ещё
            </button>
          )}
          <button type="submit" form="card-form" className="btn btn-primary">
            {card ? 'Сохранить' : 'Добавить карточку'}
          </button>
        </>
      }
    >
      <form id="card-form" className="form" onSubmit={submit} onKeyDown={handleKeyDown}>
        <div className="card-preview">
          <FitText
            className="card-preview-jp"
            text={front.trim() || 'あ'}
            maxFontSize={56}
            minFontSize={14}
          />
          <span className="card-preview-answer">
            {[reading.trim(), meaning.trim()].filter(Boolean).join(' · ') || 'чтение и перевод'}
          </span>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="card-front">Слово или знак</label>
            <KanaInput
              id="card-front"
              value={front}
              onChange={changeFront}
              mode={frontMode}
              onModeChange={setFrontMode}
              placeholder="みず или mizu"
              maxLength={80}
              autoFocus
              inputRef={frontRef}
              tip="Печатай латиницей — кана появится сама: mizu → みず"
            />
          </div>
          <div className="field">
            <label htmlFor="card-reading">
              Чтение <span className="field-hint">ромадзи</span>
            </label>
            <KanaInput
              id="card-reading"
              value={reading}
              onChange={changeReading}
              mode={readingMode}
              onModeChange={setReadingMode}
              placeholder="mizu"
              maxLength={120}
              simple
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="card-meaning">Перевод</label>
          <input
            id="card-meaning"
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder="вода"
            maxLength={160}
          />
        </div>

        <div className="field">
          <label htmlFor="card-note">
            Заметка <span className="field-hint">необязательно</span>
          </label>
          <textarea
            id="card-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Пример, подсказка или мнемоника: 水を飲む — пить воду"
            rows={3}
            maxLength={400}
          />
        </div>

        <div className="field">
          <label htmlFor="card-tags">Теги <span className="field-hint">необязательно</span></label>
          <div className="tag-input" id="card-tags">
            {tags.map((tag) => (
              <span
                key={tag}
                className="tag-chip"
              >
                {tag}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                  title={`Удалить тег «${tag}»`}
                  aria-label={`Удалить тег ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="card-tag-input"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTag(tagInput)
                }
                if (event.key === 'Escape') {
                  setTagInput('')
                  setTagSuggestions([])
                }
              }}
              onFocus={() => {
                if (tagInput.trim()) {
                  const input = tagInput.trim().toLowerCase()
                  setTagSuggestions(
                    deckTags.filter((t) => t.toLowerCase().includes(input) && !tags.includes(t)),
                  )
                }
              }}
              placeholder="Добавить тег и Enter…"
              maxLength={40}
            />

            {tagSuggestions.length > 0 && (
              <div className="tag-suggestions">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="tag-suggestion"
                    onClick={() => selectSuggestion(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="field-hint">Теги помогают находить карточки по теме или части речи.</p>
        </div>

        {!card && (
          <p className="form-hint">
            Ctrl+Enter — добавить карточку и сразу перейти к следующей.
          </p>
        )}

        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}
