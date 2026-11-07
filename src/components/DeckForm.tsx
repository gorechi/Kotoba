import { useState, type CSSProperties, type FormEvent } from 'react'
import type { Deck } from '../types'
import { useStore } from '../state/store'
import { finalizeRomajiTail, guessKanaMode, type KanaMode } from '../lib/romaji'
import { uid } from '../lib/utils'
import { KanaInput } from './KanaInput'
import { Modal } from './Modal'

const ACCENTS = ['#E1523D', '#4A5FC1', '#5C8A5A', '#C98A2E', '#D96A93', '#3E8FA8']

interface DeckFormProps {
  deck?: Deck
  onClose: () => void
}

export function DeckForm({ deck, onClose }: DeckFormProps) {
  const { update } = useStore()
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
      setError('Придумай название колоды')
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
          createdAt: Date.now(),
        })
      }
    })
    onClose()
  }

  return (
    <Modal
      title={deck ? 'Изменить колоду' : 'Новая колода'}
      subtitle={deck ? undefined : 'Например «Слова из учебника» или «Кандзи N5»'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" form="deck-form" className="btn btn-primary">
            {deck ? 'Сохранить' : 'Создать колоду'}
          </button>
        </>
      }
    >
      <form id="deck-form" className="form" onSubmit={submit}>
        <div className="deck-form-preview" style={{ '--accent': accent } as CSSProperties}>
          <span className="deck-form-watermark" aria-hidden="true">
            {(nameJp.trim() || name.trim() || '言').slice(0, 1)}
          </span>
          <span className="deck-form-preview-copy">
            <strong>{name.trim() || 'Новая колода'}</strong>
            <span>{nameJp.trim() || 'свои карточки'}</span>
          </span>
        </div>

        <div className="field">
          <label htmlFor="deck-name">Название</label>
          <input
            id="deck-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
            placeholder="Например: Слова N5"
            autoFocus
            maxLength={60}
          />
        </div>

        <div className="field">
          <label htmlFor="deck-jp">
            По-японски <span className="field-hint">необязательно</span>
          </label>
          <KanaInput
            id="deck-jp"
            value={nameJp}
            onChange={setNameJp}
            mode={nameJpMode}
            onModeChange={setNameJpMode}
            placeholder="たんご или tango"
            maxLength={40}
            tip="Печатай латиницей — кана появится сама"
          />
        </div>

        <div className="field">
          <label htmlFor="deck-desc">
            Описание <span className="field-hint">необязательно</span>
          </label>
          <input
            id="deck-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Что в этой колоде?"
            maxLength={140}
          />
        </div>

        <div className="field">
          <span className="label">Акцентный цвет</span>
          <div className="swatches">
            {ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch${accent === color ? ' active' : ''}`}
                style={{ background: color }}
                onClick={() => setAccent(color)}
                aria-label={`Цвет ${color}`}
              />
            ))}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  )
}
