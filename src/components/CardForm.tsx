import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Card } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { freshSrs } from '../lib/srs'
import { finalizeRomajiTail, guessKanaMode, suggestReading, type KanaMode } from '../lib/romaji'
import { toCyrillic } from '../lib/cyrillic'
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
  const { t } = useI18n()
  const deck = data.decks.find((item) => item.id === deckId)
  const defaultTranscription: 'romaji' | 'cyrillic' = data.settings.defaultTranscription
  const deckTags = useMemo(() => {
    const set = new Set<string>()
    data.cards
      .filter((c) => c.deckId === deckId)
      .forEach((c) => c.tags.forEach((tag) => set.add(tag)))
    return [...set].sort()
  }, [data.cards, deckId])

  const [front, setFront] = useState(card?.front ?? '')
  const [reading, setReading] = useState(card?.reading ?? '')
  const [meaning, setMeaning] = useState(card?.meaning ?? '')
  const [note, setNote] = useState(card?.note ?? '')
  const [jlpt, setJlpt] = useState(card?.jlpt ?? 0)
  const [frequency, setFrequency] = useState(
    card?.frequency ? String(card.frequency) : '',
  )
  const [tags, setTags] = useState<string[]>(card?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [frontMode, setFrontMode] = useState<KanaMode>(() => guessKanaMode(card?.front, 'hiragana'))
  const [error, setError] = useState('')
  const frontRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = tagInput.trim().toLowerCase()
    if (!input) {
      setTagSuggestions([])
      return
    }
    setTagSuggestions(
      deckTags.filter((tag) => tag.toLowerCase().includes(input) && !tags.includes(tag)),
    )
  }, [tagInput, deckTags, tags])

  // Автогенерация чтения при изменении поля «Слово или знак»
  useEffect(() => {
    const cleanFront = front.trim()
    if (!cleanFront) {
      setReading('')
      return
    }

    if (defaultTranscription === 'cyrillic') {
      setReading(toCyrillic(cleanFront))
    } else {
      setReading(suggestReading(cleanFront))
    }
  }, [front, defaultTranscription])

  const changeFront = (value: string) => {
    setFront(value)
    setError('')
  }

  const changeReading = (value: string) => {
    setReading(value)
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed)) return
    setTags([...tags, trimmed])
    setTagInput('')
    setTagSuggestions([])
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((item) => item !== tag))
  }

  const selectSuggestion = (tag: string) => {
    addTag(tag)
  }

  const save = (keepOpen: boolean) => {
    const cleanFront = finalizeRomajiTail(front, frontMode).trim()
    if (!cleanFront) {
      setError(t('cardForm.frontError'))
      frontRef.current?.focus()
      return
    }
    const cleanReading = reading.trim()
    const parsedFrequency = Math.round(Number(frequency))
    update((current) => {
      if (card) {
        return {
          ...current,
          cards: current.cards.map((item) =>
            item.id === card.id
              ? {
                  ...item,
                  front: cleanFront,
                  reading: cleanReading,
                  meaning: meaning.trim(),
                  note: note.trim(),
                  tags,
                  jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
                  frequency: parsedFrequency > 0 ? parsedFrequency : undefined,
                }
              : item,
          ),
        }
      }
      const maxOrder = current.cards.reduce(
        (max, item) => (item.deckId === deckId ? Math.max(max, item.order) : max),
        0,
      )
      return {
        ...current,
        cards: [
          ...current.cards,
          {
            id: uid('card'),
            deckId,
            front: cleanFront,
            reading: cleanReading,
            meaning: meaning.trim(),
            note: note.trim(),
            mnemonic: '',
            tags,
            jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
            frequency: parsedFrequency > 0 ? parsedFrequency : undefined,
            readings: [],
            examples: [],
            group: 'custom',
            order: maxOrder + 1,
            srs: freshSrs(),
            createdAt: Date.now(),
          },
        ],
      }
    })

    if (!keepOpen) {
      onClose()
      return
    }

    setFront('')
    setReading('')
    setMeaning('')
    setNote('')
    setJlpt(0)
    setFrequency('')
    setError('')
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
      title={card ? t('cardForm.edit') : t('cardForm.new')}
      subtitle={deck ? t('cardForm.subtitle', { name: deckTitle(deck, t) }) : undefined}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          {!card && (
            <button
              type="button"
              className="btn btn-ghost"
              title="Ctrl+Enter"
              onClick={() => save(true)}
            >
              {t('cardForm.addMore')}
            </button>
          )}
          <button type="submit" form="card-form" className="btn btn-primary">
            {card ? t('common.save') : t('cardForm.add')}
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
            {[reading.trim(), meaning.trim()].filter(Boolean).join(' · ') ||
              t('cardForm.previewPlaceholder')}
          </span>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="card-front">{t('cardForm.front')}</label>
            <KanaInput
              id="card-front"
              value={front}
              onChange={changeFront}
              mode={frontMode}
              onModeChange={setFrontMode}
              placeholder={t('cardForm.frontPlaceholder')}
              maxLength={80}
              autoFocus
              inputRef={frontRef}
              tip={t('cardForm.frontTip')}
            />
          </div>
          <div className="field">
            <label htmlFor="card-reading">{t('cardForm.reading')}</label>
            <input
              id="card-reading"
              value={reading}
              onChange={(event) => changeReading(event.target.value)}
              placeholder={
                defaultTranscription === 'cyrillic'
                  ? t('cardForm.readingPlaceholderCyrillic')
                  : t('cardForm.readingPlaceholderRomaji')
              }
              maxLength={120}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="card-meaning">{t('cardForm.meaning')}</label>
          <input
            id="card-meaning"
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder={t('cardForm.meaningPlaceholder')}
            maxLength={160}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="card-jlpt">
              {t('cardForm.jlpt')} <span className="field-hint">{t('common.optional')}</span>
            </label>
            <select
              id="card-jlpt"
              value={jlpt}
              onChange={(event) => setJlpt(Number(event.target.value))}
            >
              <option value={0}>{t('cardForm.jlptNone')}</option>
              <option value={5}>N5</option>
              <option value={4}>N4</option>
              <option value={3}>N3</option>
              <option value={2}>N2</option>
              <option value={1}>N1</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="card-frequency">
              {t('cardForm.frequency')}{' '}
              <span className="field-hint">{t('common.optional')}</span>
            </label>
            <input
              id="card-frequency"
              type="number"
              min={1}
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              placeholder={t('cardForm.frequencyPlaceholder')}
            />
            <p className="field-hint">{t('cardForm.frequencyHint')}</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="card-note">
            {t('cardForm.note')} <span className="field-hint">{t('common.optional')}</span>
          </label>
          <textarea
            id="card-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('cardForm.notePlaceholder')}
            rows={3}
            maxLength={400}
          />
        </div>

        <div className="field">
          <label htmlFor="card-tags">
            {t('cardForm.tags')} <span className="field-hint">{t('common.optional')}</span>
          </label>
          <div className="tag-input" id="card-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                  title={t('cardForm.tagRemoveTitle', { tag })}
                  aria-label={t('cardForm.tagRemoveAria', { tag })}
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
                    deckTags.filter(
                      (tag) => tag.toLowerCase().includes(input) && !tags.includes(tag),
                    ),
                  )
                }
              }}
              placeholder={t('cardForm.tagPlaceholder')}
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
          <p className="field-hint">{t('cardForm.tagsHint')}</p>
        </div>

        {!card && <p className="form-hint">{t('cardForm.ctrlEnter')}</p>}

        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}
