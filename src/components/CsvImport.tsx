import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { Card, CardExample, CardReading, Deck, DeckKind } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { deckTitle, isProtectedDeck } from '../lib/content'
import { freshSrs } from '../lib/srs'
import { uid } from '../lib/utils'
import { toCyrillic } from '../lib/cyrillic'
import { suggestReading } from '../lib/romaji'
import { toRomaji } from 'wanakana'
import {
  detectDelimiter,
  parseDelimited,
  readDelimitedFile,
  type Delimiter,
} from '../lib/delimited'
import { Icon } from './Icon'
import { Select } from './Select'

type ImportField =
  | 'front'
  | 'reading'
  | 'meaning'
  | 'note'
  | 'tags'
  | 'jlpt'
  | 'frequency'
  | 'readingKana'
  | 'readingTranscription'
  | 'exampleText'
  | 'exampleTranscription'
  | 'exampleTranslation'

interface FieldDef {
  key: ImportField
  labelKey: string
  required?: boolean
}

const KANA_FIELDS: FieldDef[] = [
  { key: 'front', labelKey: 'data.fieldFrontKana', required: true },
  { key: 'reading', labelKey: 'data.fieldReading' },
  { key: 'meaning', labelKey: 'data.fieldMeaning', required: true },
  { key: 'note', labelKey: 'data.fieldNote' },
  { key: 'tags', labelKey: 'data.fieldTags' },
  { key: 'jlpt', labelKey: 'data.fieldJlpt' },
  { key: 'frequency', labelKey: 'data.fieldFrequency' },
]

const KANJI_FIELDS: FieldDef[] = [
  { key: 'front', labelKey: 'data.fieldFrontKanji', required: true },
  { key: 'meaning', labelKey: 'data.fieldMeaning', required: true },
  { key: 'readingKana', labelKey: 'data.fieldReadingKana' },
  { key: 'readingTranscription', labelKey: 'data.fieldReadingTranscription' },
  { key: 'exampleText', labelKey: 'data.fieldExampleText' },
  { key: 'exampleTranscription', labelKey: 'data.fieldExampleTranscription' },
  { key: 'exampleTranslation', labelKey: 'data.fieldExampleTranslation' },
  { key: 'note', labelKey: 'data.fieldNote' },
  { key: 'tags', labelKey: 'data.fieldTags' },
  { key: 'jlpt', labelKey: 'data.fieldJlpt' },
  { key: 'frequency', labelKey: 'data.fieldFrequency' },
]

const ACCENTS: Record<DeckKind, string> = {
  kana: '#E1523D',
  kanji: '#4A5FC1',
}

function parseTags(value: string): string[] {
  return [...new Set(value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean))]
}

function parseJlpt(value: string): number | undefined {
  const match = value.trim().match(/^(?:JLPT\s*)?(?:N\s*)?([1-5])$/i)
  return match ? Number(match[1]) : undefined
}

function parseFrequency(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return undefined
  const frequency = Number(digits)
  return Number.isFinite(frequency) && frequency > 0 ? frequency : undefined
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function CsvImport({ kind }: { kind: DeckKind }) {
  const { data, update } = useStore()
  const { t } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<{ name: string; text: string } | null>(null)
  const [delimiterMode, setDelimiterMode] = useState<'auto' | Delimiter>('auto')
  const [hasHeader, setHasHeader] = useState(true)
  const [mapping, setMapping] = useState<Partial<Record<ImportField, number>>>({})
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new')
  const [targetDeckId, setTargetDeckId] = useState('')
  const [newDeckName, setNewDeckName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fields = kind === 'kana' ? KANA_FIELDS : KANJI_FIELDS
  const existingDecks = useMemo(
    () => data.decks.filter((deck) => deck.kind === kind && !isProtectedDeck(deck)),
    [data.decks, kind],
  )
  const hasBuiltinDecks = data.decks.some(
    (deck) => deck.kind === kind && isProtectedDeck(deck),
  )

  const delimiter = useMemo<Delimiter>(() => {
    if (!file) return ','
    return delimiterMode === 'auto' ? detectDelimiter(file.text) : delimiterMode
  }, [file, delimiterMode])

  const table = useMemo(() => {
    if (!file) return { rows: [] as string[][], columns: [] as { index: number; label: string; sample: string }[] }

    const rows = parseDelimited(file.text, delimiter).filter((row) =>
      row.some((cell) => cell.trim() !== ''),
    )
    if (!rows.length) return { rows: [] as string[][], columns: [] as { index: number; label: string; sample: string }[] }

    const width = Math.max(...rows.map((row) => row.length))
    const header = hasHeader ? rows[0] : []
    const dataRows = hasHeader ? rows.slice(1) : rows
    const columns = Array.from({ length: width }, (_, index) => {
      const label =
        (hasHeader ? header[index]?.trim() : '') || t('data.column', { n: index + 1 })
      const sample = dataRows[0]?.[index]?.trim() ?? ''
      return { index, label: truncate(label, 42), sample: truncate(sample, 42) }
    })

    return { rows: dataRows, columns }
  }, [file, delimiter, hasHeader, t])

  useEffect(() => {
    if (targetMode !== 'existing') return
    if (!existingDecks.length) {
      setTargetMode('new')
      setTargetDeckId('')
      return
    }
    if (!existingDecks.some((deck) => deck.id === targetDeckId)) {
      setTargetDeckId(existingDecks[0].id)
    }
  }, [existingDecks, targetDeckId, targetMode])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const title = kind === 'kana' ? t('data.kanaTitle') : t('data.kanjiTitle')
  const subtitle = kind === 'kana' ? t('data.kanaSub') : t('data.kanjiSub')

  const scrollToTop = () => {
    window.requestAnimationFrame(() => {
      document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return

    setError(null)
    setNotice(null)

    const extension = selected.name.split('.').pop()?.toLowerCase()
    if (extension !== 'csv' && extension !== 'tsv') {
      setError(t('data.fileTypeError'))
      return
    }

    try {
      const text = await readDelimitedFile(selected)
      if (!text.trim()) {
        setError(t('data.fileEmpty'))
        return
      }

      setFile({ name: selected.name, text })
      setDelimiterMode('auto')
      setHasHeader(true)
      setMapping({})
      setTargetMode('new')
      setTargetDeckId('')
      setNewDeckName(
        selected.name.replace(/\.[^.]+$/, '').trim() || t('data.untitledDeck'),
      )
      scrollToTop()
    } catch {
      setError(t('data.fileReadError'))
    }
  }

  const reset = () => {
    setFile(null)
    setMapping({})
    setError(null)
    scrollToTop()
  }

  const setFieldMapping = (key: ImportField, value: string) => {
    setMapping((current) => {
      const next = { ...current }
      if (value === '') delete next[key]
      else next[key] = Number(value)
      return next
    })
  }

  const requiredFields = fields.filter((field) => field.required)
  const requiredMapped = requiredFields.every(
    (field) =>
      mapping[field.key] !== undefined &&
      (mapping[field.key] as number) >= 0 &&
      (mapping[field.key] as number) < table.columns.length,
  )
  const targetValid =
    targetMode === 'new'
      ? newDeckName.trim().length > 0
      : existingDecks.some((deck) => deck.id === targetDeckId)
  const canContinue =
    Boolean(file) && table.rows.length > 0 && requiredMapped && targetValid && !busy

  const cell = (row: string[], key: ImportField): string => {
    const index = mapping[key]
    return index === undefined ? '' : (row[index] ?? '').trim()
  }

  const importCards = () => {
    if (!canContinue || !file) return

    setBusy(true)
    setError(null)
    setNotice(null)

    const now = Date.now()
    const existingDeck =
      targetMode === 'existing'
        ? existingDecks.find((deck) => deck.id === targetDeckId)
        : undefined
    const deckId = existingDeck?.id ?? uid('deck')
    const newDeck: Deck | null =
      targetMode === 'new'
        ? {
            id: deckId,
            name: newDeckName.trim(),
            nameJp: '',
            description: '',
            accent: ACCENTS[kind],
            builtin: false,
            kind,
            createdAt: now,
          }
        : null
    const startOrder =
      Math.max(
        0,
        ...data.cards
          .filter((card) => card.deckId === deckId)
          .map((card) => card.order),
      ) + 1
    let order = startOrder
    let skipped = 0
    const cards: Card[] = []

    table.rows.forEach((row, index) => {
      const front = cell(row, 'front')
      if (!front) {
        skipped += 1
        return
      }

      if (kind === 'kana') {
        const reading = cell(row, 'reading') || suggestReading(front)
        cards.push({
          id: uid('card'),
          deckId,
          front,
          reading,
          meaning: cell(row, 'meaning'),
          note: cell(row, 'note'),
          mnemonic: '',
          tags: parseTags(cell(row, 'tags')),
          jlpt: parseJlpt(cell(row, 'jlpt')),
          frequency: parseFrequency(cell(row, 'frequency')),
          readings: [],
          examples: [],
          group: 'custom',
          order: order++,
          srs: freshSrs(),
          createdAt: now + index,
        })
        return
      }

      const readingKana = cell(row, 'readingKana')
      const transcriptionCell = cell(row, 'readingTranscription')
      const transcription =
        transcriptionCell ||
        (readingKana
          ? data.settings.defaultTranscription === 'cyrillic'
            ? toCyrillic(readingKana)
            : toRomaji(readingKana).toLowerCase()
          : '')
      const readings: CardReading[] =
        readingKana || transcription
          ? [{ id: uid('reading'), kana: readingKana, transcription }]
          : []

      const exampleText = cell(row, 'exampleText')
      const exampleTranscription = cell(row, 'exampleTranscription')
      const exampleTranslation = cell(row, 'exampleTranslation')
      const examples: CardExample[] =
        exampleText || exampleTranscription || exampleTranslation
          ? [
              {
                id: uid('example'),
                text: exampleText,
                transcription: exampleTranscription,
                translation: exampleTranslation,
              },
            ]
          : []

      const meaning = cell(row, 'meaning')
      if (!meaning && !readings.length) {
        skipped += 1
        return
      }

      cards.push({
        id: uid('card'),
        deckId,
        front,
        reading: '',
        meaning,
        note: cell(row, 'note'),
        mnemonic: '',
        tags: parseTags(cell(row, 'tags')),
        jlpt: parseJlpt(cell(row, 'jlpt')),
        frequency: parseFrequency(cell(row, 'frequency')),
        readings,
        examples,
        group: 'custom',
        order: order++,
        srs: freshSrs(),
        createdAt: now + index,
      })
    })

    if (!cards.length) {
      setError(t('data.importNoCards'))
      setBusy(false)
      return
    }

    update((draft) => {
      if (newDeck) draft.decks.push(newDeck)
      draft.cards.push(...cards)
    })

    setNotice(
      skipped
        ? t('data.importDoneSkipped', { n: cards.length, skipped })
        : t('data.importDone', { n: cards.length }),
    )
    setFile(null)
    setMapping({})
    setBusy(false)
  }

  const hiddenInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".csv,.tsv,text/csv,text/tab-separated-values"
      hidden
      onChange={(event) => void handleFile(event)}
    />
  )

  if (!file) {
    return (
      <>
        {hiddenInput}
        <section className="panel data-import-panel">
          <div className="panel-head">
            <div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="data-file-picker">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="upload" size={17} />
              {t('data.chooseFile')}
            </button>
            <span className="hint">{t('data.fileHint')}</span>
          </div>

          {notice && (
            <p className="notice">
              <Icon name="check" size={15} />
              <span>{notice}</span>
            </p>
          )}
          {error && <p className="form-error">{error}</p>}

          <p className="hint">{t('data.importHint')}</p>
        </section>
      </>
    )
  }

  return (
    <>
      {hiddenInput}
      <section className="panel data-import-panel data-mapping-panel">
        <div className="panel-head data-mapping-head">
          <div>
            <div className="eyebrow">{t('data.mappingEyebrow')}</div>
            <h2>{t('data.mappingTitle')}</h2>
            <p>{t('data.mappingSub')}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-small" onClick={reset}>
            <Icon name="chevron-left" size={14} />
            {t('data.back')}
          </button>
        </div>

        <div className="data-file-meta">
          <span>
            <Icon name="upload" size={13} />
            {file.name}
          </span>
          <span>{t('data.rowsCount', { n: table.rows.length })}</span>
          <span>{t('data.columnsCount', { n: table.columns.length })}</span>
        </div>

        <div className="data-file-options">
          <label className="data-option">
            <span>{t('data.delimiter')}</span>
            <Select
              value={delimiterMode}
              onChange={(event) => {
                setDelimiterMode(event.target.value as 'auto' | Delimiter)
                setMapping({})
              }}
            >
              <option value="auto">{t('data.delimiterAuto')}</option>
              <option value=",">{t('data.delimiterComma')}</option>
              <option value=";">{t('data.delimiterSemicolon')}</option>
              <option value={'\t'}>{t('data.delimiterTab')}</option>
            </Select>
          </label>

          <label className="data-check">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(event) => {
                setHasHeader(event.target.checked)
                setMapping({})
              }}
            />
            <span>{t('data.headerRow')}</span>
          </label>
        </div>

        <div className="data-target">
          <span className="label">{t('data.targetDeck')}</span>
          <div className="segmented data-target-switch">
            <button
              type="button"
              className={targetMode === 'new' ? 'active' : ''}
              onClick={() => setTargetMode('new')}
            >
              {t('data.newDeck')}
            </button>
            <button
              type="button"
              className={targetMode === 'existing' ? 'active' : ''}
              disabled={!existingDecks.length}
              onClick={() => setTargetMode('existing')}
            >
              {t('data.existingDeck')}
            </button>
          </div>

          {targetMode === 'new' ? (
            <input
              value={newDeckName}
              onChange={(event) => setNewDeckName(event.target.value)}
              placeholder={t('data.newDeckPlaceholder')}
              aria-label={t('data.newDeck')}
              maxLength={60}
            />
          ) : (
            <Select
              value={targetDeckId}
              aria-label={t('data.targetDeck')}
              onChange={(event) => setTargetDeckId(event.target.value)}
            >
              {existingDecks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deckTitle(deck, t)}
                </option>
              ))}
            </Select>
          )}

          {!existingDecks.length && <p className="hint">{t('data.noExistingDecks')}</p>}
          {hasBuiltinDecks && <p className="hint">{t('data.builtinDecksHint')}</p>}
        </div>

        <div className="mapping-list">
          {fields.map((field) => (
            <div className="mapping-row" key={field.key}>
              <div className="mapping-label">
                <strong>{t(field.labelKey)}</strong>
                <span className={field.required ? 'mapping-required' : 'mapping-optional'}>
                  {field.required ? t('data.required') : t('data.optional')}
                </span>
              </div>
              <Select
                value={mapping[field.key] ?? ''}
                aria-label={t(field.labelKey)}
                onChange={(event) => setFieldMapping(field.key, event.target.value)}
              >
                <option value="" disabled={field.required}>
                  {field.required ? t('data.selectColumn') : t('data.skipColumn')}
                </option>
                {table.columns.map((column) => (
                  <option key={column.index} value={column.index}>
                    {column.label}
                    {column.sample ? ` — ${column.sample}` : ''}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>

        {table.rows.length === 0 && <p className="form-error">{t('data.noDataRows')}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="mapping-actions">
          <button type="button" className="btn btn-ghost" onClick={reset}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canContinue}
            onClick={importCards}
          >
            {t('data.continue')}
          </button>
        </div>

        <p className="hint">
          {kind === 'kana' ? t('data.kanaMappingHint') : t('data.kanjiMappingHint')}
        </p>
      </section>
    </>
  )
}
