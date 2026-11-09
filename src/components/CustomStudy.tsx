import { useEffect, useMemo, useState } from 'react'
import type { IconName } from './Icon'
import type {
  CustomStudyOptions,
  CustomStudyPreset,
  CustomStudyStatus,
  CustomStudyKind,
} from '../lib/custom-study'
import { buildCustomStudyQueue, presetOptions } from '../lib/custom-study'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle } from '../lib/content'
import { Icon } from './Icon'
import { Modal } from './Modal'
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

export function CustomStudy({
  onStart,
}: {
  onStart: (options: CustomStudyOptions, title: string) => boolean
}) {
  const { data } = useStore()
  const { t } = useI18n()
  const [notice, setNotice] = useState<string | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [form, setForm] = useState<CustomStudyOptions>(DEFAULT_OPTIONS)
  const now = Date.now()

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const card of data.cards) {
      for (const tag of card.tags) tags.add(tag)
    }
    return [...tags].sort((a, b) => a.localeCompare(b))
  }, [data.cards])

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
      setForm(DEFAULT_OPTIONS)
      setBuilderOpen(true)
      return
    }
    const options = presetOptions(preset)
    const started = onStart(options, t(`customStudy.${preset}`))
    if (!started) setNotice(t('customStudy.empty'))
  }

  const openBuilder = () => {
    setForm(DEFAULT_OPTIONS)
    setBuilderOpen(true)
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

  const startCustom = () => {
    if (!available) return
    const started = onStart(form, titleForOptions(form))
    if (started) {
      setBuilderOpen(false)
      return
    }
    setNotice(t('customStudy.empty'))
  }

  return (
    <section className="section custom-study-section">
      <div className="section-head">
        <div>
          <h2>{t('customStudy.title')}</h2>
          <p className="section-sub">{t('customStudy.sub')}</p>
        </div>
        <button type="button" className="link-btn" onClick={openBuilder}>
          {t('customStudy.setup')}
          <Icon name="sliders" size={15} />
        </button>
      </div>

      <div className="custom-study-grid">
        {PRESETS.map((preset) => {
          const count = countForPreset(preset.id)
          return (
            <button
              type="button"
              key={preset.id}
              className={`custom-study-card${count === 0 ? ' is-empty' : ''}`}
              onClick={() => startPreset(preset.id)}
            >
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
          )
        })}
      </div>

      {notice && (
        <p className="custom-study-empty">
          <Icon name="bulb" size={15} />
          <span>{notice}</span>
        </p>
      )}

      {builderOpen && (
        <Modal
          title={t('customStudy.builderTitle')}
          subtitle={t('customStudy.builderSub')}
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
    </section>
  )
}
