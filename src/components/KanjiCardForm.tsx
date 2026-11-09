import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Card, CardExample, CardReading } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { freshSrs } from '../lib/srs'
import { convertRomajiTail, guessKanaMode } from '../lib/romaji'
import { toCyrillic } from '../lib/cyrillic'
import { uid } from '../lib/utils'
import { toRomaji } from 'wanakana'
import { FitText } from './FitText'
import { Icon } from './Icon'
import { Modal } from './Modal'

interface KanjiCardFormProps {
  deckId: string
  card?: Card | null
  onClose: () => void
}

function emptyReading(): CardReading {
  return { id: uid('reading'), kana: '', transcription: '' }
}

function emptyExample(): CardExample {
  return { id: uid('example'), text: '', transcription: '', translation: '' }
}

export function KanjiCardForm({ deckId, card, onClose }: KanjiCardFormProps) {
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
  const [meaning, setMeaning] = useState(card?.meaning ?? '')
  const [note, setNote] = useState(card?.note ?? '')
  const [readings, setReadings] = useState<CardReading[]>(
    card?.readings.length ? card.readings : [emptyReading()],
  )
  const [examples, setExamples] = useState<CardExample[]>(
    card?.examples.length ? card.examples : [emptyExample()],
  )
  const [tags, setTags] = useState<string[]>(card?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
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

  const transcriptionFor = (kana: string) =>
    defaultTranscription === 'cyrillic' ? toCyrillic(kana) : toRomaji(kana).toLowerCase()

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

  const updateReading = (id: string, patch: Partial<CardReading>) => {
    setReadings((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const changeReadingKana = (id: string, value: string) => {
    const kana = convertRomajiTail(value, guessKanaMode(value, 'hiragana'))
    updateReading(id, { kana, transcription: transcriptionFor(kana) })
  }

  const updateExample = (id: string, patch: Partial<CardExample>) => {
    setExamples((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const changeExampleText = (id: string, value: string) => {
    const text = convertRomajiTail(value, guessKanaMode(value, 'hiragana'))
    updateExample(id, { text })
  }

  const addReading = () => setReadings((prev) => [...prev, emptyReading()])
  const removeReading = (id: string) => {
    setReadings((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : [emptyReading()]))
  }

  const addExample = () => setExamples((prev) => [...prev, emptyExample()])
  const removeExample = (id: string) => {
    setExamples((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : [emptyExample()]))
  }

  const resetRows = () => {
    setReadings([emptyReading()])
    setExamples([emptyExample()])
  }

  const save = (keepOpen: boolean) => {
    const cleanFront = front.trim()
    if (!cleanFront) {
      setError(t('kanjiForm.frontError'))
      frontRef.current?.focus()
      return
    }
    const cleanReadings = readings
      .map((item) => ({
        ...item,
        kana: item.kana.trim(),
        transcription: item.transcription.trim(),
      }))
      .filter((item) => item.kana || item.transcription)
    const cleanExamples = examples
      .map((item) => ({
        ...item,
        text: item.text.trim(),
        transcription: item.transcription.trim(),
        translation: item.translation.trim(),
      }))
      .filter((item) => item.text || item.transcription || item.translation)
    const cleanMeaning = meaning.trim()

    if (!cleanMeaning && !cleanReadings.length) {
      setError(t('kanjiForm.contentError'))
      return
    }

    update((draft) => {
      if (card) {
        const target = draft.cards.find((item) => item.id === card.id)
        if (target) {
          target.front = cleanFront
          target.meaning = cleanMeaning
          target.note = note.trim()
          target.tags = tags
          target.readings = cleanReadings
          target.examples = cleanExamples
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
        reading: '',
        meaning: cleanMeaning,
        note: note.trim(),
        mnemonic: '',
        tags,
        readings: cleanReadings,
        examples: cleanExamples,
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
    setMeaning('')
    setNote('')
    setError('')
    resetRows()
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

  const previewAnswer =
    [meaning.trim(), readings[0]?.kana.trim()].filter(Boolean).join(' · ') ||
    t('kanjiForm.previewPlaceholder')

  return (
    <Modal
      title={card ? t('kanjiForm.edit') : t('kanjiForm.new')}
      subtitle={deck ? t('kanjiForm.subtitle', { name: deckTitle(deck, t) }) : undefined}
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
              {t('kanjiForm.addMore')}
            </button>
          )}
          <button type="submit" form="kanji-card-form" className="btn btn-primary">
            {card ? t('common.save') : t('kanjiForm.add')}
          </button>
        </>
      }
    >
      <form
        id="kanji-card-form"
        className="form"
        onSubmit={submit}
        onKeyDown={handleKeyDown}
      >
        <div className="card-preview">
          <FitText
            className="card-preview-jp"
            text={front.trim() || '水'}
            maxFontSize={56}
            minFontSize={14}
          />
          <span className="card-preview-answer">{previewAnswer}</span>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="kanji-front">{t('kanjiForm.kanji')}</label>
            <input
              ref={frontRef}
              id="kanji-front"
              className="jp-input"
              value={front}
              onChange={(event) => {
                setFront(event.target.value)
                setError('')
              }}
              placeholder="水"
              maxLength={40}
              autoFocus
              spellCheck={false}
            />
            <p className="field-hint">{t('kanjiForm.kanjiHint')}</p>
          </div>
          <div className="field">
            <label htmlFor="kanji-meaning">{t('kanjiForm.meaning')}</label>
            <input
              id="kanji-meaning"
              value={meaning}
              onChange={(event) => setMeaning(event.target.value)}
              placeholder={t('kanjiForm.meaningPlaceholder')}
              maxLength={160}
            />
          </div>
        </div>

        <section className="kanji-block">
          <div className="kanji-block-head">
            <div>
              <h3>{t('kanjiForm.readings')}</h3>
              <p className="field-hint">{t('kanjiForm.readingsHint')}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-small" onClick={addReading}>
              <Icon name="plus" size={14} />
              {t('common.add')}
            </button>
          </div>
          {readings.map((item, index) => (
            <div className="kanji-row" key={item.id}>
              <input
                className="jp-input"
                value={item.kana}
                onChange={(event) => changeReadingKana(item.id, event.target.value)}
                placeholder={index === 0 ? 'みず' : 'すい'}
                aria-label={t('kanjiForm.readingKanaAria')}
                maxLength={60}
                spellCheck={false}
              />
              <input
                value={item.transcription}
                onChange={(event) => updateReading(item.id, { transcription: event.target.value })}
                placeholder={
                  defaultTranscription === 'cyrillic'
                    ? t('kanjiForm.readingTranscriptionCyrillic')
                    : t('kanjiForm.readingTranscriptionRomaji')
                }
                aria-label={t('kanjiForm.readingTranscriptionAria')}
                maxLength={120}
                spellCheck={false}
              />
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => removeReading(item.id)}
                title={t('kanjiForm.removeReading')}
                aria-label={t('kanjiForm.removeReading')}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </section>

        <section className="kanji-block">
          <div className="kanji-block-head">
            <div>
              <h3>{t('kanjiForm.examples')}</h3>
              <p className="field-hint">{t('kanjiForm.examplesHint')}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-small" onClick={addExample}>
              <Icon name="plus" size={14} />
              {t('common.add')}
            </button>
          </div>
          {examples.map((item, index) => (
            <div className="kanji-example" key={item.id}>
              <div className="kanji-row kanji-row--example">
                <input
                  className="jp-input"
                  value={item.text}
                  onChange={(event) => changeExampleText(item.id, event.target.value)}
                  placeholder={index === 0 ? '水を飲む' : '水が冷たい'}
                  aria-label={t('kanjiForm.exampleJpAria')}
                  maxLength={160}
                  spellCheck={false}
                />
                <input
                  value={item.transcription}
                  onChange={(event) =>
                    updateExample(item.id, { transcription: event.target.value })
                  }
                  placeholder={
                    defaultTranscription === 'cyrillic'
                      ? t('kanjiForm.exampleTranscriptionCyrillic')
                      : t('kanjiForm.exampleTranscriptionRomaji')
                  }
                  aria-label={t('kanjiForm.exampleTranscriptionAria')}
                  maxLength={200}
                  spellCheck={false}
                />
                <input
                  value={item.translation}
                  onChange={(event) => updateExample(item.id, { translation: event.target.value })}
                  placeholder={t('kanjiForm.exampleTranslationPlaceholder')}
                  aria-label={t('kanjiForm.exampleTranslationAria')}
                  maxLength={200}
                />
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removeExample(item.id)}
                  title={t('kanjiForm.removeExample')}
                  aria-label={t('kanjiForm.removeExample')}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
          ))}
        </section>

        <div className="field">
          <label htmlFor="kanji-note">
            {t('kanjiForm.note')} <span className="field-hint">{t('common.optional')}</span>
          </label>
          <textarea
            id="kanji-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('kanjiForm.notePlaceholder')}
            rows={2}
            maxLength={400}
          />
        </div>

        <div className="field">
          <label htmlFor="kanji-tags">
            {t('kanjiForm.tags')} <span className="field-hint">{t('common.optional')}</span>
          </label>
          <div className="tag-input" id="kanji-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                  title={t('kanjiForm.tagRemoveTitle', { tag })}
                  aria-label={t('kanjiForm.tagRemoveAria', { tag })}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="kanji-tag-input"
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
              placeholder={t('kanjiForm.tagPlaceholder')}
              maxLength={40}
            />
            {tagSuggestions.length > 0 && (
              <div className="tag-suggestions">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="tag-suggestion"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!card && <p className="form-hint">{t('kanjiForm.ctrlEnter')}</p>}

        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}
