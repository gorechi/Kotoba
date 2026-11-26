import { describe, expect, it } from 'vitest'
import { normalizeData, normalizeImported } from './normalize'
import type { TrashEntry } from '../types'
import { makeCard, makeDeck } from '../test/factories'

const DAY = 86_400_000

describe('normalizeData: базовая структура', () => {
  it('на пустых данных создаёт стартовый набор', () => {
    const data = normalizeData(null)
    expect(data.version).toBe(2)
    expect(data.decks.map((deck) => deck.id).sort()).toEqual(['hiragana', 'katakana'])
    expect(data.cards).toHaveLength(142)
    expect(data.trash).toEqual([])
    expect(data.studySets).toEqual([])
  })

  it('создаёт стартовый набор, если на входе не объект', () => {
    const data = normalizeData('мусор')
    expect(data.decks.map((deck) => deck.id).sort()).toEqual(['hiragana', 'katakana'])
  })

  it('всегда добавляет встроенные азбуки к пользовательским колодам', () => {
    const data = normalizeData({
      decks: [makeDeck({ id: 'custom', name: 'Своя' })],
      cards: [],
    })
    const ids = data.decks.map((deck) => deck.id)
    expect(ids).toContain('custom')
    expect(ids).toContain('hiragana')
    expect(ids).toContain('katakana')
  })
})

describe('normalizeData: настройки', () => {
  it('ставит значения по умолчанию', () => {
    const settings = normalizeData({}).settings
    expect(settings.theme).toBe('system')
    expect(settings.newPerDay).toBe(10)
    expect(settings.sessionSize).toBe(0)
    expect(settings.trashRetentionDays).toBe(10)
    expect(settings.onboardingDone).toBe(true)
    expect(settings.tourDone).toBe(true)
    expect(settings.ttsAutoplay).toBe('off')
    expect(settings.duplicateAction).toBe('ask')
  })

  it('включает тур для новой установки и не показывает его существующим данным', () => {
    expect(normalizeData(null).settings.tourDone).toBe(false)
    expect(normalizeData({ settings: { tourDone: false } }).settings.tourDone).toBe(false)
    expect(normalizeData({ settings: { tourDone: true } }).settings.tourDone).toBe(true)
  })

  it('нормализует настройку дубликатов', () => {
    expect(
      normalizeData({ settings: { duplicateAction: 'deny' } }).settings.duplicateAction,
    ).toBe('deny')
    expect(
      normalizeData({ settings: { duplicateAction: 'oops' } }).settings.duplicateAction,
    ).toBe('ask')
  })

  it('сохраняет выбранный режим автоплея', () => {    expect(normalizeData({ settings: { ttsAutoplay: 'reading' } }).settings.ttsAutoplay).toBe(
      'reading',
    )
    expect(normalizeData({ settings: { ttsAutoplay: 'always' } }).settings.ttsAutoplay).toBe(
      'always',
    )
  })

  it('ограничивает числовые значения разумными пределами', () => {    const settings = normalizeData({
      settings: {
        newPerDay: 999,
        dayStartHour: 99,
        ttsRate: 9,
        leechThreshold: 99,
        dailyReviewGoal: 0,
        sessionSize: 9999,
      },
    }).settings

    expect(settings.newPerDay).toBe(50)
    expect(settings.dayStartHour).toBe(12)
    expect(settings.ttsRate).toBe(1.5)
    expect(settings.leechThreshold).toBe(50)
    expect(settings.dailyReviewGoal).toBe(1)
    expect(settings.sessionSize).toBe(500)
  })

  it('понимает срок хранения корзины и «никогда»', () => {
    expect(normalizeData({ settings: { trashRetentionDays: 0 } }).settings.trashRetentionDays).toBe(0)
    expect(normalizeData({ settings: { trashRetentionDays: 4 } }).settings.trashRetentionDays).toBe(4)
    expect(normalizeData({ settings: { trashRetentionDays: 15 } }).settings.trashRetentionDays).toBe(10)
    expect(normalizeData({ settings: { trashRetentionDays: -3 } }).settings.trashRetentionDays).toBe(1)
  })

  it('отбрасывает неизвестные значения перечислений', () => {
    const settings = normalizeData({
      settings: {
        theme: 'neon',
        language: 'klingon',
        autoBackup: 'hourly',
        studyMode: 'fly',
        ttsAutoplay: 'sometimes',
      },
    }).settings
    expect(settings.theme).toBe('system')
    expect(settings.language).toBe('en')
    expect(settings.autoBackup).toBe('daily')
    expect(settings.studyMode).toBe('reading')
    expect(settings.ttsAutoplay).toBe('off')
  })
})

describe('normalizeData: история', () => {
  it('оставляет только корректные дни и сохраняет действия с карточками', () => {
    const history = normalizeData({
      history: {
        '2026-01-15': { reviews: 5, correct: 4, newCards: 2, ms: 1000, work: 3 },
        'не дата': { reviews: 99 },
        '2026-01-16': 'мусор',
      },
    }).history

    expect(Object.keys(history)).toEqual(['2026-01-15'])
    expect(history['2026-01-15'].work).toBe(3)
  })

  it('не сохраняет отрицательные и нулевые действия', () => {
    const history = normalizeData({
      history: { '2026-01-15': { reviews: 1, work: 0 } },
    }).history
    expect(history['2026-01-15'].work).toBeUndefined()
  })

  it('подтягивает общие счётчики до режима письма', () => {
    const history = normalizeData({
      history: {
        '2026-01-15': { reviews: 1, correct: 0, newCards: 0, ms: 100, writing: { reviews: 4, correct: 3, newCards: 2, ms: 500 } },
      },
    }).history['2026-01-15']

    expect(history.reviews).toBe(4)
    expect(history.correct).toBe(3)
    expect(history.newCards).toBe(2)
    expect(history.ms).toBe(500)
    expect(history.writing?.reviews).toBe(4)
  })
})

describe('normalizeData: карточки', () => {
  it('убирает карточки без обязательных полей и повторы', () => {
    const data = normalizeData({
      decks: [makeDeck({ id: 'custom' })],
      cards: [
        makeCard({ id: 'ok', deckId: 'custom' }),
        makeCard({ id: 'ok', deckId: 'custom', front: 'дубль' }),
        { id: 'no-front', deckId: 'custom' },
        makeCard({ id: 'no-deck', deckId: 'missing' }),
      ],
    })

    const customCards = data.cards.filter((card) => card.deckId === 'custom')
    expect(customCards).toHaveLength(1)
    expect(customCards[0].front).toBe('ひらがな')
  })

  it('проставляет письменность по тексту — миграция старых карточек', () => {
    const data = normalizeData({
      decks: [makeDeck({ id: 'custom' })],
      cards: [
        makeCard({ id: 'hira', deckId: 'custom', front: 'ひらがな' }),
        makeCard({ id: 'kata', deckId: 'custom', front: 'カタカナ' }),
        makeCard({ id: 'mixed', deckId: 'custom', front: 'ひらがなとカタカナ' }),
        makeCard({ id: 'kanji', deckId: 'custom', front: '食べる' }),
      ],
    })

    const byId = new Map(data.cards.map((card) => [card.id, card]))
    expect(byId.get('hira')?.script).toBe('hiragana')
    expect(byId.get('kata')?.script).toBe('katakana')
    expect(byId.get('mixed')?.script).toBe('mixed')
    expect(byId.get('kanji')?.script).toBeUndefined()
  })

  it('чистит необязательные поля', () => {
    const data = normalizeData({
      decks: [makeDeck({ id: 'custom' })],
      cards: [
        makeCard({
          id: 'card',
          deckId: 'custom',
          jlpt: 9,
          frequency: -5,
          readings: [{ id: '', kana: '  ', transcription: '' }],
          examples: [{ id: '', text: ' ', transcription: '', translation: '' }],
        }),
      ],
    })
    const card = data.cards.find((item) => item.id === 'card')
    expect(card?.jlpt).toBeUndefined()
    expect(card?.frequency).toBeUndefined()
    expect(card?.readings).toEqual([])
    expect(card?.examples).toEqual([])
  })
})

describe('normalizeData: корзина', () => {
  it('читает карточки и колоды, отбрасывая мусор', () => {
    const now = Date.now()
    const trash: unknown[] = [
      {
        id: 'card-1',
        kind: 'card',
        deletedAt: now,
        card: makeCard({ id: 'card-1', deckId: 'custom' }),
      },
      {
        id: 'deck-1',
        kind: 'deck',
        deletedAt: now,
        deck: makeDeck({ id: 'deck-1' }),
        cards: [
          makeCard({ id: 'deck-card', deckId: 'deck-1' }),
          makeCard({ id: 'foreign', deckId: 'other' }),
        ],
      },
      { id: 'broken', kind: 'card', deletedAt: now },
      { id: 'unknown', kind: 'nope', deletedAt: now },
    ]

    const data = normalizeData({ trash })
    expect(data.trash).toHaveLength(2)
    const deckEntry = data.trash.find((entry) => entry.kind === 'deck')
    expect(deckEntry?.kind === 'deck' && deckEntry.cards.map((card) => card.id)).toEqual([
      'deck-card',
    ])
  })

  it('удаляет записи старше срока хранения', () => {
    const old = Date.now() - 20 * DAY
    const entry: TrashEntry = {
      id: 'card-1',
      kind: 'card',
      deletedAt: old,
      card: makeCard({ id: 'card-1' }),
    }

    expect(normalizeData({ trash: [entry] }).trash).toHaveLength(0)
    expect(
      normalizeData({ settings: { trashRetentionDays: 0 }, trash: [entry] }).trash,
    ).toHaveLength(1)
  })
})

describe('normalizeData: свои наборы', () => {
  it('сохраняет письменность и сбрасывает её для кандзи', () => {
    const data = normalizeData({
      studySets: [
        {
          id: 'kana',
          name: 'Хирагана',
          options: { script: 'hiragana', kind: 'kana' },
        },
        {
          id: 'kanji',
          name: 'Кандзи',
          options: { script: 'katakana', kind: 'kanji' },
        },
      ],
    })

    const byId = new Map(data.studySets.map((set) => [set.id, set]))
    expect(byId.get('kana')?.options.script).toBe('hiragana')
    expect(byId.get('kanji')?.options.script).toBeUndefined()
  })

  it('отбрасывает наборы без названия и с некорректными опциями', () => {
    const data = normalizeData({
      studySets: [
        { id: 'empty', name: '   ', options: {} },
        {
          id: 'ok',
          name: 'Норм',
          options: { kind: 'nope', status: 'nope', jlpt: 99, limit: -10 },
        },
      ],
    })

    expect(data.studySets).toHaveLength(1)
    const options = data.studySets[0].options
    expect(options.kind).toBe('all')
    expect(options.status).toBe('all')
    expect(options.jlpt).toBeUndefined()
    expect(options.limit).toBe(0)
  })
})

describe('normalizeImported', () => {
  it('не подмешивает встроенные азбуки', () => {
    const imported = normalizeImported({
      decks: [makeDeck({ id: 'custom' })],
      cards: [makeCard({ id: 'card', deckId: 'custom' })],
    })
    expect(imported.decks.map((deck) => deck.id)).toEqual(['custom'])
    expect(imported.cards.map((card) => card.id)).toEqual(['card'])
  })

  it('убирает карточки без колоды и дубли', () => {
    const imported = normalizeImported({
      decks: [makeDeck({ id: 'custom' })],
      cards: [
        makeCard({ id: 'a', deckId: 'custom' }),
        makeCard({ id: 'a', deckId: 'custom' }),
        makeCard({ id: 'b', deckId: 'missing' }),
      ],
    })
    expect(imported.cards.map((card) => card.id)).toEqual(['a'])
  })
})
