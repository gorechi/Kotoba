import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Card, CardExample, CardReading } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { cardExampleTranslation, cardMeaning, deckTitle } from '../lib/content'
import { freshSrs } from '../lib/srs'
import { detectKanaScript } from '../lib/kana-script'
import { convertKanaInput, finalizeKanaInput } from '../lib/cyrillic-input'
import { guessKanaMode } from '../lib/romaji'
import { toCyrillic } from '../lib/cyrillic'
import { findDuplicateCards, duplicateOutcome } from '../lib/duplicates'
import { uid } from '../lib/utils'
import { toRomaji } from 'wanakana'
import { FitText } from './FitText'
import { Icon } from './Icon'
import { Select } from './Select'
import { TagInput } from './TagInput'
import { DuplicateCardsDialog, DuplicateDenyDialog } from './DuplicateCardsDialog'
import { Modal } from './Modal'

interface KanjiCardFormProps {
  deckId: string
  card?: Card | null
  initialFront?: string
  onSaved?: (card: Card) => void
  onClose: () => void
}

function emptyReading(): CardReading {
  return { id: uid('reading'), kana: '', transcription: '' }
}

function emptyExample(): CardExample {
  return { id: uid('example'), text: '', transcription: '', translation: '' }
}

export function KanjiCardForm({
  deckId,
  card,
  initialFront,
  onSaved,
  onClose,
}: KanjiCardFormProps) {
  const { data, update, trackWork } = useStore()
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

  const [front, setFront] = useState(card?.front ?? initialFront ?? '')
  const [meaning, setMeaning] = useState(() => (card ? cardMeaning(card, t) : ''))
  const [note, setNote] = useState(card?.note ?? '')
  const [jlpt, setJlpt] = useState(card?.jlpt ?? 0)
  const [frequency, setFrequency] = useState(
    card?.frequency ? String(card.frequency) : '',
  )
  const [readings, setReadings] = useState<CardReading[]>(
    card?.readings.length ? card.readings : [emptyReading()],
  )
  const [examples, setExamples] = useState<CardExample[]>(() => {
    if (!card?.examples.length) return [emptyExample()]
    return card.examples.map((item) => ({
      ...item,
      translation: cardExampleTranslation(card, item, t),
    }))
  })
  const [tags, setTags] = useState<string[]>(card?.tags ?? [])
  const [error, setError] = useState('')
  const [duplicateDialog, setDuplicateDialog] = useState<{
    mode: 'ask' | 'deny'
    cards: Card[]
    front: string
    keepOpen: boolean
  } | null>(null)
  const frontRef = useRef<HTMLInputElement>(null)

  const transcriptionFor = (kana: string) =>
    defaultTranscription === 'cyrillic' ? toCyrillic(kana) : toRomaji(kana).toLowerCase()

  const updateReading = (id: string, patch: Partial<CardReading>) => {
    setReadings((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const changeReadingKana = (id: string, value: string) => {
    const kana = convertKanaInput(value, guessKanaMode(value, 'hiragana'))
    updateReading(id, { kana, transcription: transcriptionFor(kana) })
  }

  const updateExample = (id: string, patch: Partial<CardExample>) => {
    setExamples((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const changeExampleText = (id: string, value: string) => {
    const text = convertKanaInput(value, guessKanaMode(value, 'hiragana'))
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

  const buildPayload = (cleanFront: string) => {
    const cleanReadings = readings
      .map((item) => ({
        ...item,
        kana: finalizeKanaInput(
          item.kana,
          guessKanaMode(item.kana, 'hiragana'),
        ).trim(),
        transcription: item.transcription.trim(),
      }))
      .filter((item) => item.kana || item.transcription)
    const cleanExamples = examples
      .map((item) => ({
        ...item,
        text: finalizeKanaInput(
          item.text,
          guessKanaMode(item.text, 'hiragana'),
        ).trim(),
        transcription: item.transcription.trim(),
        translation: item.translation.trim(),
      }))
      .filter((item) => item.text || item.transcription || item.translation)
    const cleanMeaning = meaning.trim()
    const frontChanged = Boolean(card && cleanFront !== card.front)
    const localizedMeaning = card ? cardMeaning(card, t) : ''
    const nextMeaning =
      card && !frontChanged && !card.meaning.trim() && cleanMeaning === localizedMeaning
        ? ''
        : cleanMeaning
    const nextExamples = cleanExamples.map((item) => {
      const original = card?.examples.find((example) => example.id === item.id)
      if (!card || !original) return item
      const localized = cardExampleTranslation(card, original, t)
      const exampleChanged =
        original.text.trim() !== item.text ||
        original.transcription.trim() !== item.transcription
      return {
        ...item,
        translation:
          !exampleChanged &&
          !original.translation.trim() &&
          item.translation === localized
            ? ''
            : item.translation,
      }
    })
    const parsedFrequency = Math.round(Number(frequency))

    if (!cleanMeaning && !cleanReadings.length) {
      setError(t('kanjiForm.contentError'))
      return null
    }

    return {
      cleanFront,
      cleanReadings,
      cleanExamples,
      cleanMeaning,
      nextMeaning,
      nextExamples,
      parsedFrequency,
    }
  }

  const commit = (
    payload: NonNullable<ReturnType<typeof buildPayload>>,
    keepOpen: boolean,
  ) => {
    const {
      cleanFront,
      cleanReadings,
      cleanExamples,
      cleanMeaning,
      nextMeaning,
      nextExamples,
      parsedFrequency,
    } = payload

    const maxOrder = data.cards.reduce(
      (max, item) => (item.deckId === deckId ? Math.max(max, item.order) : max),
      0,
    )
    const createdCard: Card | null = card
      ? null
      : {
          id: uid('card'),
          deckId,
          front: cleanFront,
          reading: '',
          meaning: cleanMeaning,
          note: note.trim(),
          mnemonic: '',
          tags,
          script: detectKanaScript(cleanFront) ?? undefined,
          jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
          frequency: parsedFrequency > 0 ? parsedFrequency : undefined,
          readings: cleanReadings,
          examples: cleanExamples,
          group: 'custom',
          order: maxOrder + 1,
          srs: freshSrs(),
          createdAt: Date.now(),
        }

    update((current) => {
      if (card) {
        return {
          ...current,
          cards: current.cards.map((item) =>
            item.id === card.id
              ? {
                  ...item,
                  front: cleanFront,
                  meaning: nextMeaning,
                  note: note.trim(),
                  tags,
                  script: detectKanaScript(cleanFront) ?? undefined,
                  jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
                  frequency: parsedFrequency > 0 ? parsedFrequency : undefined,
                  readings: cleanReadings,
                  examples: nextExamples,
                }
              : item,
          ),
        }
      }
      if (!createdCard) return current
      return {
        ...current,
        cards: [...current.cards, createdCard],
      }
    })
    trackWork()
    if (createdCard) onSaved?.(createdCard)

    if (!keepOpen) {
      onClose()
      return
    }

    setFront('')
    setMeaning('')
    setNote('')
    setJlpt(0)
    setFrequency('')
    setError('')
    resetRows()
    window.requestAnimationFrame(() => frontRef.current?.focus())
  }

  const save = (keepOpen: boolean) => {
    const cleanFront = front.trim()
    if (!cleanFront) {
      setError(t('kanjiForm.frontError'))
      frontRef.current?.focus()
      return
    }

    const payload = buildPayload(cleanFront)
    if (!payload) return

    if (card) {
      commit(payload, keepOpen)
      return
    }

    const duplicates = findDuplicateCards(data.cards, cleanFront)
    const outcome = duplicateOutcome(duplicates, data.settings.duplicateAction)
    if (outcome === 'create') {
      commit(payload, keepOpen)
      return
    }

    setDuplicateDialog({
      mode: outcome,
      cards: duplicates,
      front: cleanFront,
      keepOpen,
    })
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
    <>
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
          <div className="field is-required">
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

        <div className="form-row">
          <div className="field">
            <label htmlFor="kanji-jlpt">{t('cardForm.jlpt')}</label>
            <Select
              id="kanji-jlpt"
              value={jlpt}
              onChange={(event) => setJlpt(Number(event.target.value))}
            >
              <option value={0}>{t('cardForm.jlptNone')}</option>
              <option value={5}>N5</option>
              <option value={4}>N4</option>
              <option value={3}>N3</option>
              <option value={2}>N2</option>
              <option value={1}>N1</option>
            </Select>
          </div>
          <div className="field">
            <label htmlFor="kanji-frequency">{t('cardForm.frequency')}</label>
            <input
              id="kanji-frequency"
              type="number"
              min={1}
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              placeholder={t('cardForm.frequencyPlaceholder')}
            />
            <p className="field-hint">{t('cardForm.frequencyHint')}</p>
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
          <label htmlFor="kanji-note">{t('kanjiForm.note')}</label>
          <textarea
            id="kanji-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('kanjiForm.notePlaceholder')}
            rows={2}
            maxLength={400}
          />
        </div>

        <TagInput
          id="kanji-tag-input"
          label={t('kanjiForm.tags')}
          tags={tags}
          suggestions={deckTags}
          onChange={setTags}
          placeholder={t('kanjiForm.tagPlaceholder')}
          removeTitle={(tag) => t('kanjiForm.tagRemoveTitle', { tag })}
          removeAria={(tag) => t('kanjiForm.tagRemoveAria', { tag })}
        />

        {!card && <p className="form-hint">{t('kanjiForm.ctrlEnter')}</p>}

        {error && <p className="form-error">{error}</p>}
      </form>
      </Modal>

      {duplicateDialog?.mode === 'ask' && (
        <DuplicateCardsDialog
          cards={duplicateDialog.cards}
          onIgnore={() => {
            const pending = duplicateDialog
            if (!pending) return
            setDuplicateDialog(null)
            const payload = buildPayload(pending.front)
            if (payload) commit(payload, pending.keepOpen)
          }}
          onCancel={() => setDuplicateDialog(null)}
        />
      )}
      {duplicateDialog?.mode === 'deny' && (
        <DuplicateDenyDialog onClose={() => setDuplicateDialog(null)} />
      )}
    </>
  )
}
