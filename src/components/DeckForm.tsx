import { useState, type CSSProperties, type FormEvent } from 'react'
import type { Deck, DeckKind } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { finalizeRomajiTail, guessKanaMode, type KanaMode } from '../lib/romaji'
import { uid } from '../lib/utils'
import { KanaInput } from './KanaInput'
import { Modal } from './Modal'

const ACCENTS = ['#E1523D', '#4A5FC1', '#5C8A5A', '#C98A2E', '#D96A93', '#3E8FA8']

interface DeckFormProps {
  deck?: Deck
  /** Тип создаваемой колоды. При редактировании берётся из deck. */
  kind?: DeckKind
  onClose: () => void
}

export function DeckForm({ deck, kind = 'kana', onClose }: DeckFormProps) {
  const { update } = useStore()
  const { t } = useI18n()
  const deckKind: DeckKind = deck?.kind ?? kind
  const isKanji = deckKind === 'kanji'
  const [name, setName] = useState(deck?.name ?? '')
  const [nameJp, setNameJp] = useState(deck?.nameJp ?? '')
  const [nameJpMode, setNameJpMode] = useState<KanaMode>(() => guessKanaMode(deck?.nameJp, 'hiragana'))
  const [description, setDescription] = useState(deck?.description ?? '')
  const [accent, setAccent] = useState(deck?.accent ?? ACCENTS[0])
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) {
      setError(t('deckForm.nameError'))
      return
    }
    const cleanNameJp = finalizeRomajiTail(nameJp, nameJpMode).trim()
    update((draft) => {
      if (deck) {
        const target = draft.decks.find((item) => item.id === deck.id)
        if (target) {
          target.name = cleanName
          target.nameJp = cleanNameJp
          target.description = description.trim()
          target.accent = accent
        }
      } else {
        draft.decks.push({
          id: uid('deck'),
          name: cleanName,
          nameJp: cleanNameJp,
          description: description.trim(),
          accent,
          builtin: false,
          kind: deckKind,
          createdAt: Date.now(),
        })
      }
    })
    onClose()
  }

  return (
    <Modal
      title={
        deck
          ? isKanji
            ? t('deckForm.editKanji')
            : t('deckForm.edit')
          : isKanji
            ? t('deckForm.newKanji')
            : t('deckForm.new')
      }
      subtitle={
        deck
          ? undefined
          : isKanji
            ? t('deckForm.subtitleKanji')
            : t('deckForm.subtitleKana')
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" form="deck-form" className="btn btn-primary">
            {deck ? t('common.save') : t('deckForm.create')}
          </button>
        </>
      }
    >
      <form id="deck-form" className="form" onSubmit={submit}>
        <div className="deck-form-preview" style={{ '--accent': accent } as CSSProperties}>
          <span className="deck-form-watermark" aria-hidden="true">
            {(nameJp.trim() || name.trim() || (isKanji ? '漢' : '言')).slice(0, 1)}
          </span>
          <span className="deck-form-preview-copy">
            <strong>
              {name.trim() || (isKanji ? t('deckForm.previewNewKanji') : t('deckForm.previewNew'))}
            </strong>
            <span>{nameJp.trim() || (isKanji ? '漢字' : t('deckForm.previewCustom'))}</span>
          </span>
        </div>

        <div className="field">
          <label htmlFor="deck-name">{t('deckForm.name')}</label>
          <input
            id="deck-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder={isKanji ? t('deckForm.namePlaceholderKanji') : t('deckForm.namePlaceholderKana')}
            autoFocus
            maxLength={60}
          />
        </div>

        <div className="field">
          <label htmlFor="deck-jp">
            {t('deckForm.jp')} <span className="field-hint">{t('common.optional')}</span>
          </label>
          <KanaInput
            id="deck-jp"
            value={nameJp}
            onChange={setNameJp}
            mode={nameJpMode}
            onModeChange={setNameJpMode}
            placeholder={t('deckForm.jpPlaceholder')}
            maxLength={40}
            tip={t('deckForm.jpTip')}
          />
        </div>

        <div className="field">
          <label htmlFor="deck-desc">
            {t('deckForm.description')} <span className="field-hint">{t('common.optional')}</span>
          </label>
          <input
            id="deck-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('deckForm.descriptionPlaceholder')}
            maxLength={140}
          />
        </div>

        <div className="field">
          <span className="label">{t('deckForm.accent')}</span>
          <div className="swatches">
            {ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch${accent === color ? ' active' : ''}`}
                style={{ background: color }}
                onClick={() => setAccent(color)}
                aria-label={t('deckForm.colorAria', { color })}
              />
            ))}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}
