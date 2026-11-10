import { useEffect, useMemo, useState } from 'react'
import type { IconName } from './Icon'
import type { StudySet } from '../types'
import type {
  CustomStudyKind,
  CustomStudyOptions,
  CustomStudyPreset,
  CustomStudyStatus,
} from '../lib/custom-study'
import { buildCustomStudyQueue, presetOptions } from '../lib/custom-study'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { uid } from '../lib/utils'
import { Icon } from './Icon'
import { ConfirmDialog, Modal } from './Modal'
import { Select } from './Select'

type HomePreset = CustomStudyPreset | 'tag'

const PRESETS: {
  id: HomePreset
  labelKey: string
  descKey: string
  icon: IconName
}[] = [
  { id: 'overdue', labelKey: 'customStudy.overdue', descKey: 'customStudy.overdueDesc', icon: 'rotate' },
  { id: 'new', labelKey: 'customStudy.new', descKey: 'customStudy.newDesc', icon: 'sparkles' },
  { id: 'jlpt5', labelKey: 'customStudy.jlpt5', descKey: 'customStudy.jlpt5Desc', icon: 'target' },
  { id: 'jlpt4', labelKey: 'customStudy.jlpt4', descKey: 'customStudy.jlpt4Desc', icon: 'trophy' },
  { id: 'kanji', labelKey: 'customStudy.kanji', descKey: 'customStudy.kanjiDesc', icon: 'kanji' },
  { id: 'tag', labelKey: 'customStudy.tag', descKey: 'customStudy.tagDesc', icon: 'layers' },
  { id: 'marathon', labelKey: 'customStudy.marathon', descKey: 'customStudy.marathonDesc', icon: 'flame' },
  { id: 'mistakes', labelKey: 'customStudy.mistakes', descKey: 'customStudy.mistakesDesc', icon: 'bulb' },
]

const DEFAULT_OPTIONS: CustomStudyOptions = {
  deckId: 'all',
  status: 'all',
  kind: 'all',
  limit: 50,
}

const LIMITS = [10, 20, 30, 50, 100, 200, 0]

const STATUS_LABEL_KEYS: Record<Exclude<CustomStudyStatus, 'all'>, string> = {
  overdue: 'customStudy.statusOverdue',
  new: 'customStudy.statusNew',
  mistakes: 'customStudy.statusMistakes',
}

const KIND_LABEL_KEYS: Record<Exclude<CustomStudyKind, 'all'>, string> = {
  kana: 'customStudy.typeKana',
  kanji: 'customStudy.typeKanji',
}

export function CustomStudy({
  onStart,
}: {
  onStart: (options: CustomStudyOptions, title: string) => boolean
}) {
  const { data, update } = useStore()
  const { t } = useI18n()
  const [notice, setNotice] = useState<string | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<StudySet | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudySet | null>(null)
  const [form, setForm] = useState<CustomStudyOptions>(DEFAULT_OPTIONS)
  const [setName, setSetName] = useState('')
  const now = Date.now()

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const card of data.cards) {
      for (const tag of card.tags) tags.add(tag)
    }
    return [...tags].sort((a, b) => a.localeCompare(b))
  }, [data.cards])

  const studySets = data.studySets ?? []

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const countForPreset = (preset: HomePreset): number | null => {
    if (preset === 'tag') return null
    return buildCustomStudyQueue(
      data.cards,
      data.decks,
      presetOptions(preset),
      now,
    ).length
  }

  const startPreset = (preset: HomePreset) => {
    setNotice(null)
    if (preset === 'tag') {
      openBuilder()
      return
    }
    const options = presetOptions(preset)
    const started = onStart(options, t(`customStudy.${preset}`))
    if (!started) setNotice(t('customStudy.empty'))
  }

  const openBuilder = (set?: StudySet) => {
    setNotice(null)
    setEditingSet(set ?? null)
    setForm(set ? { ...set.options } : DEFAULT_OPTIONS)
    setSetName(set?.name ?? '')
    setBuilderOpen(true)
  }

  const startSavedSet = (set: StudySet) => {
    setNotice(null)
    const started = onStart(set.options, set.name)
    if (!started) setNotice(t('customStudy.empty'))
  }

  const saveSet = () => {
    const name = setName.trim()
    if (!name) return
    const stamp = Date.now()
    if (editingSet) {
      update((draft) => {
        const target = draft.studySets?.find((item) => item.id === editingSet.id)
        if (target) {
          target.name = name
          target.options = { ...form }
          target.updatedAt = stamp
        }
      })
      setNotice(t('customStudy.updated'))
    } else {
      update((draft) => {
        if (!draft.studySets) draft.studySets = []
        draft.studySets.push({
          id: uid('set'),
          name,
          options: { ...form },
          createdAt: stamp,
          updatedAt: stamp,
        })
      })
      setNotice(t('customStudy.saved'))
    }
    setBuilderOpen(false)
  }

  const deleteSet = (set: StudySet) => {
    update((draft) => {
      draft.studySets = (draft.studySets ?? []).filter((item) => item.id !== set.id)
    })
    setNotice(t('customStudy.deleted'))
  }

  const builderQueue = builderOpen
    ? buildCustomStudyQueue(data.cards, data.decks, form, now)
    : []
  const available = builderQueue.length

  const titleForOptions = (options: CustomStudyOptions): string => {
    if (options.tag) return t('customStudy.tagTitle', { tag: options.tag })
    if (options.jlpt) return `JLPT N${options.jlpt}`
    if (options.status === 'overdue') return t('customStudy.overdue')
    if (options.status === 'new') return t('customStudy.new')
    if (options.status === 'mistakes') return t('customStudy.mistakes')
    if (options.kind === 'kanji') return t('customStudy.kanji')
    return t('customStudy.title')
  }

  const summaryForOptions = (options: CustomStudyOptions): string => {
    const parts: string[] = []
    if (options.deckId !== 'all') {
      const deck = data.decks.find((item) => item.id === options.deckId)
      if (deck) parts.push(deckTitle(deck, t))
    }
    if (options.jlpt) parts.push(`JLPT N${options.jlpt}`)
    if (options.status !== 'all') parts.push(t(STATUS_LABEL_KEYS[options.status]))
    if (options.kind !== 'all') parts.push(t(KIND_LABEL_KEYS[options.kind]))
    if (options.tag) parts.push(t('customStudy.tagTitle', { tag: options.tag }))
    if (options.limit > 0) parts.push(t('customStudy.limitN', { n: options.limit }))
    return parts.length ? parts.join(' · ') : t('customStudy.allCardsSummary')
  }

  const startCustom = () => {
    if (!available) return
    const title = setName.trim() || titleForOptions(form)
    const started = onStart(form, title)
    if (started) {
      setBuilderOpen(false)
      return
    }
    setNotice(t('customStudy.empty'))
  }

  const presetCards = PRESETS.map((preset) => {
    const count = countForPreset(preset.id)
    return (
      <div className="custom-study-card-wrap" key={preset.id}>
        <button
          type="button"
          className={`custom-study-card custom-study-card--preset${
            count === 0 ? ' is-empty' : ''
          }`}
          onClick={() => startPreset(preset.id)}
        >
          <span className="custom-study-lock" title={t('customStudy.locked')}>
            <Icon name="lock" size={12} />
          </span>
          <span className="custom-study-icon">
            <Icon name={preset.icon} size={18} />
          </span>
          <strong>{t(preset.labelKey)}</strong>
          <span className="custom-study-desc">{t(preset.descKey)}</span>
          <span className="custom-study-count">
            {preset.id === 'tag'
              ? t('customStudy.chooseTag')
              : t('customStudy.cardsCount', { n: count ?? 0 })}
          </span>
        </button>
      </div>
    )
  })

  return (
    <section className="section custom-study-section">
      <div className="section-head">
        <div>
          <h2>{t('customStudy.title')}</h2>
          <p className="section-sub">{t('customStudy.sub')}</p>
        </div>
        <button type="button" className="link-btn" onClick={() => openBuilder()}>
          {t('customStudy.setup')}
          <Icon name="sliders" size={15} />
        </button>
      </div>

      {notice && (
        <p className="custom-study-empty">
          <Icon name="bulb" size={15} />
          <span>{notice}</span>
        </p>
      )}

      <div className="custom-study-group">
        <div className="custom-study-group-head">
          <h3>{t('customStudy.presetsGroup')}</h3>
          <span>{t('customStudy.presetsHint')}</span>
        </div>
        <div className="custom-study-grid">{presetCards}</div>
      </div>

      <div className="custom-study-group">
        <div className="custom-study-group-head">
          <h3>{t('customStudy.mySetsGroup')}</h3>
          <span>{t('customStudy.mySetsHint')}</span>
        </div>

        {studySets.length > 0 ? (
          <div className="custom-study-grid">
            {studySets.map((set) => {
              const count = buildCustomStudyQueue(
                data.cards,
                data.decks,
                set.options,
                now,
              ).length
              return (
                <div className="custom-study-card-wrap" key={set.id}>
                  <button
                    type="button"
                    className={`custom-study-card custom-study-card--user${
                      count === 0 ? ' is-empty' : ''
                    }`}
                    onClick={() => startSavedSet(set)}
                  >
                    <span className="custom-study-icon">
                      <Icon name="bookmark" size={18} />
                    </span>
                    <strong>{set.name}</strong>
                    <span className="custom-study-desc">
                      {summaryForOptions(set.options)}
                    </span>
                    <span className="custom-study-count">
                      {t('customStudy.cardsCount', { n: count })}
                    </span>
                  </button>
                  <div className="custom-study-actions">
                    <button
                      type="button"
                      className="custom-study-action"
                      title={t('customStudy.editSet')}
                      aria-label={t('customStudy.editSet')}
                      onClick={() => openBuilder(set)}
                    >
                      <Icon name="pencil" size={13} />
                    </button>
                    <button
                      type="button"
                      className="custom-study-action danger"
                      title={t('customStudy.deleteSet')}
                      aria-label={t('customStudy.deleteSet')}
                      onClick={() => setDeleteTarget(set)}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="custom-study-placeholder">{t('customStudy.noSets')}</p>
        )}
      </div>

      {builderOpen && (
        <Modal
          title={editingSet ? t('customStudy.editTitle') : t('customStudy.builderTitle')}
          subtitle={editingSet ? t('customStudy.editSub') : t('customStudy.builderSub')}
          onClose={() => setBuilderOpen(false)}
          wide
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setBuilderOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!setName.trim()}
                onClick={saveSet}
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!available}
                onClick={startCustom}
              >
                {t('customStudy.start')}
              </button>
            </>
          }
        >
          <div className="form">
            <div className="field">
              <label htmlFor="custom-name">{t('customStudy.name')}</label>
              <input
                id="custom-name"
                value={setName}
                onChange={(event) => setSetName(event.target.value)}
                placeholder={t('customStudy.namePlaceholder')}
                maxLength={60}
                autoFocus
              />
              <p className="field-hint">{t('customStudy.nameHint')}</p>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="custom-deck">{t('customStudy.deck')}</label>
                <Select
                  id="custom-deck"
                  value={form.deckId}
                  onChange={(event) => setForm({ ...form, deckId: event.target.value })}
                >
                  <option value="all">{t('customStudy.allDecks')}</option>
                  {data.decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deckTitle(deck, t)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="field">
                <label htmlFor="custom-status">{t('customStudy.status')}</label>
                <Select
                  id="custom-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as CustomStudyStatus })
                  }
                >
                  <option value="all">{t('customStudy.statusAll')}</option>
                  <option value="overdue">{t('customStudy.statusOverdue')}</option>
                  <option value="new">{t('customStudy.statusNew')}</option>
                  <option value="mistakes">{t('customStudy.statusMistakes')}</option>
                </Select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="custom-kind">{t('customStudy.type')}</label>
                <Select
                  id="custom-kind"
                  value={form.kind}
                  onChange={(event) =>
                    setForm({ ...form, kind: event.target.value as CustomStudyKind })
                  }
                >
                  <option value="all">{t('customStudy.typeAll')}</option>
                  <option value="kana">{t('customStudy.typeKana')}</option>
                  <option value="kanji">{t('customStudy.typeKanji')}</option>
                </Select>
              </div>

              <div className="field">
                <label htmlFor="custom-jlpt">{t('customStudy.jlpt')}</label>
                <Select
                  id="custom-jlpt"
                  value={form.jlpt ? String(form.jlpt) : ''}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jlpt: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                >
                  <option value="">{t('customStudy.jlptAny')}</option>
                  <option value="5">N5</option>
                  <option value="4">N4</option>
                  <option value="3">N3</option>
                  <option value="2">N2</option>
                  <option value="1">N1</option>
                </Select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="custom-tag">{t('customStudy.tagFilter')}</label>
                <Select
                  id="custom-tag"
                  value={form.tag ?? ''}
                  onChange={(event) =>
                    setForm({ ...form, tag: event.target.value || undefined })
                  }
                >
                  <option value="">{t('customStudy.tagAny')}</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </Select>
                {!allTags.length && <p className="field-hint">{t('customStudy.noTags')}</p>}
              </div>

              <div className="field">
                <label htmlFor="custom-limit">{t('customStudy.limit')}</label>
                <Select
                  id="custom-limit"
                  value={String(form.limit)}
                  onChange={(event) =>
                    setForm({ ...form, limit: Number(event.target.value) })
                  }
                >
                  {LIMITS.map((limit) => (
                    <option key={limit} value={limit}>
                      {limit === 0 ? t('customStudy.limitAll') : limit}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <p className={`custom-study-available${available === 0 ? ' is-empty' : ''}`}>
              {t('customStudy.available', { n: available })}
            </p>
            {available === 0 && <p className="form-error">{t('customStudy.noCards')}</p>}
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t('customStudy.deleteTitle')}
          text={t('customStudy.deleteText', { name: deleteTarget.name })}
          confirmLabel={t('customStudy.deleteConfirm')}
          danger
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteSet(deleteTarget)}
        />
      )}
    </section>
  )
}
