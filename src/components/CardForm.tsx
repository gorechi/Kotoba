import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Card } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { freshSrs } from '../lib/srs'
import { detectKanaScript } from '../lib/kana-script'
import { guessKanaMode, suggestReading, type KanaMode } from '../lib/romaji'
import { finalizeKanaInput } from '../lib/cyrillic-input'
import { toCyrillic } from '../lib/cyrillic'
import { findDuplicateCards, duplicateOutcome } from '../lib/duplicates'
import { uid } from '../lib/utils'
import { FitText } from './FitText'
import { KanaInput } from './KanaInput'
import { Select } from './Select'
import { TagInput } from './TagInput'
import { DuplicateCardsDialog, DuplicateDenyDialog } from './DuplicateCardsDialog'
import { Modal } from './Modal'

interface CardFormProps {
  deckId: string
  card?: Card | null
  initialFront?: string
  onSaved?: (card: Card) => void
  onClose: () => void
}

export function CardForm({ deckId, card, initialFront, onSaved, onClose }: CardFormProps) {
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

  const startFront = card?.front ?? initialFront ?? ''
  const [front, setFront] = useState(startFront)
  const [reading, setReading] = useState(card?.reading ?? '')
  const [meaning, setMeaning] = useState(card?.meaning ?? '')
  const [note, setNote] = useState(card?.note ?? '')
  const [jlpt, setJlpt] = useState(card?.jlpt ?? 0)
  const [frequency, setFrequency] = useState(
    card?.frequency ? String(card.frequency) : '',
  )
  const [tags, setTags] = useState<string[]>(card?.tags ?? [])
  const [frontMode, setFrontMode] = useState<KanaMode>(() => guessKanaMode(startFront, 'hiragana'))
  const [error, setError] = useState('')
  const [duplicateDialog, setDuplicateDialog] = useState<{
    mode: 'ask' | 'deny'
    cards: Card[]
    front: string
    keepOpen: boolean
  } | null>(null)
  const frontRef = useRef<HTMLInputElement>(null)

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

  const commit = (cleanFront: string, keepOpen: boolean) => {
    const cleanReading = reading.trim()
    const parsedFrequency = Math.round(Number(frequency))
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
          reading: cleanReading,
          meaning: meaning.trim(),
          note: note.trim(),
          mnemonic: '',
          tags,
          script: detectKanaScript(cleanFront) ?? undefined,
          jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
          frequency: parsedFrequency > 0 ? parsedFrequency : undefined,
          readings: [],
          examples: [],
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
                  reading: cleanReading,
                  meaning: meaning.trim(),
                  note: note.trim(),
                  tags,
                  script: detectKanaScript(cleanFront) ?? undefined,
                  jlpt: jlpt >= 1 && jlpt <= 5 ? jlpt : undefined,
                  frequency: parsedFrequency > 0 ? parsedFrequency : undefined,
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
    setReading('')
    setMeaning('')
    setNote('')
    setJlpt(0)
    setFrequency('')
    setError('')
    window.requestAnimationFrame(() => frontRef.current?.focus())
  }

  const save = (keepOpen: boolean) => {
    const cleanFront = finalizeKanaInput(front, frontMode).trim()
    if (!cleanFront) {
      setError(t('cardForm.frontError'))
      frontRef.current?.focus()
      return
    }
    if (card) {
      commit(cleanFront, keepOpen)
      return
    }

    const duplicates = findDuplicateCards(data.cards, cleanFront)
    const outcome = duplicateOutcome(duplicates, data.settings.duplicateAction)
    if (outcome === 'create') {
      commit(cleanFront, keepOpen)
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

  return (
    <>
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
          <div className="field is-required">
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
            <label htmlFor="card-jlpt">{t('cardForm.jlpt')}</label>
            <Select
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
            </Select>
          </div>
          <div className="field">
            <label htmlFor="card-frequency">{t('cardForm.frequency')}</label>
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
          <label htmlFor="card-note">{t('cardForm.note')}</label>
          <textarea
            id="card-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('cardForm.notePlaceholder')}
            rows={3}
            maxLength={400}
          />
        </div>

        <TagInput
          id="card-tag-input"
          label={t('cardForm.tags')}
          tags={tags}
          suggestions={deckTags}
          onChange={setTags}
          placeholder={t('cardForm.tagPlaceholder')}
          removeTitle={(tag) => t('cardForm.tagRemoveTitle', { tag })}
          removeAria={(tag) => t('cardForm.tagRemoveAria', { tag })}
        />

        {!card && <p className="form-hint">{t('cardForm.ctrlEnter')}</p>}

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
            commit(pending.front, pending.keepOpen)
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
