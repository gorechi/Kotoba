import { useCallback, useMemo } from 'react'
import type { Card } from '../types'
import { useStore } from '../state/store'
import { FitText } from '../components/FitText'
import { Icon } from '../components/Icon'
import {
  HIRAGANA_BASIC,
  HIRAGANA_VOICED,
  KATAKANA_BASIC,
  KATAKANA_VOICED,
} from '../data/kana'

type KanaDeckId = 'hiragana' | 'katakana'

interface KanaSection {
  id: KanaDeckId
  label: string
  labelJp: string
  seeds: { kana: string; romaji: string }[]
}

const SECTIONS: KanaSection[] = [
  {
    id: 'hiragana',
    label: 'Хирагана',
    labelJp: 'ひらがな',
    seeds: [...HIRAGANA_BASIC, ...HIRAGANA_VOICED].map((s) => ({ kana: s.kana, romaji: s.romaji })),
  },
  {
    id: 'katakana',
    label: 'Катакана',
    labelJp: 'カタカナ',
    seeds: [...KATAKANA_BASIC, ...KATAKANA_VOICED].map((s) => ({ kana: s.kana, romaji: s.romaji })),
  },
]

export function KanaMap({ onStudyCard }: { onStudyCard: (cardId: string, deckId: string) => void }) {
  const { data } = useStore()
  const now = Date.now()

  const findCard = useCallback(
    (deckId: string, kana: string): Card | undefined =>
      data.cards.find((card) => card.deckId === deckId && card.front === kana),
    [data.cards],
  )

  const cardStatus = useCallback((card: Card | undefined): 'new' | 'due' | 'learned' => {
    if (!card) return 'new'
    if (!card.srs.introduced) return 'new'
    if (card.srs.due <= now) return 'due'
    return 'learned'
  }, [now])

  const sectionStat = useCallback(
    (seeds: { kana: string; romaji: string }[], deckId: string) => {
      const cards = seeds.map((s) => findCard(deckId, s.kana)).filter(Boolean) as Card[]
      const learned = cards.filter((c) => c.srs.introduced).length
      const due = cards.filter((c) => c.srs.introduced && c.srs.due <= now).length
      const fresh = cards.filter((c) => !c.srs.introduced).length
      return { total: seeds.length, learned, due, fresh }
    },
    [findCard, now],
  )

  const allCards = data.cards.filter(
    (c) => c.deckId === 'hiragana' || c.deckId === 'katakana',
  )
  const totalLearned = allCards.filter((c) => c.srs.introduced).length
  const totalDue = allCards.filter((c) => c.srs.introduced && c.srs.due <= now).length
  const totalFresh = allCards.filter((c) => !c.srs.introduced).length
  const totalChars = allCards.length

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Карта каны</div>
          <h1>Хирагана и катакана</h1>
          <p className="page-sub">
            Прогресс по каждому знаку. Кликните на знак — начнётся подход только с ним.
          </p>
        </div>
      </header>

      <div className="kana-map-stats">
        <div className="kana-map-stat">
          <strong>{totalChars}</strong>
          <span>знаков</span>
        </div>
        <div className="kana-map-stat">
          <strong style={{ color: 'var(--green)' }}>{totalLearned}</strong>
          <span>изучено</span>
        </div>
        <div className="kana-map-stat">
          <strong style={{ color: 'var(--red)' }}>{totalDue}</strong>
          <span>к повторению</span>
        </div>
        <div className="kana-map-stat">
          <strong>{totalFresh}</strong>
          <span>новых</span>
        </div>
      </div>

      <div className="kana-grid-wrap">
        {SECTIONS.map((section) => {
          const stat = sectionStat(section.seeds, section.id)
          const duePct = stat.total ? Math.round((stat.due / stat.total) * 100) : 0
          const learnedPct = stat.total ? Math.round((stat.learned / stat.total) * 100) : 0

          return (
            <section className="kana-section" key={section.id}>
              <div className="kana-section-head">
                <h2>{section.label}</h2>
                <span className="kana-section-jp" aria-hidden="true">
                  {section.labelJp}
                </span>
              </div>
              <div className="kana-section-stats">
                <span>
                  <b>{stat.learned}</b> из {stat.total} изучено
                </span>
                <span>
                  <b style={{ color: 'var(--red)' }}>{stat.due}</b>
                  к повторению
                </span>
                <span>
                  <b>{stat.fresh}</b>
                  новых
                </span>
                <span>
                  <b>{learnedPct}%</b>
                  прогресс
                </span>
              </div>
              <div className="kana-grid">
                {section.seeds.map((seed) => {
                  const card = findCard(section.id, seed.kana)
                  const status = cardStatus(card)
                  const hasMnemonic = Boolean(card?.mnemonic?.trim())
                  return (
                    <button
                      type="button"
                      className={`kana-cell kana-cell--${status}`}
                      key={seed.kana}
                      disabled={!card}
                      onClick={() => {
                        if (!card) return
                        onStudyCard(card.id, section.id)
                      }}
                      title={
                        !card
                          ? 'Знак не найден в базе'
                          : `${seed.kana} (${seed.romaji}) — ${status === 'due' ? 'к повторению' : status === 'learned' ? 'изучён' : 'новый'}${
                              hasMnemonic ? ', есть мнемоника' : ''
                            }`
                      }
                      aria-label={`${seed.kana} — ${status === 'due' ? 'к повторению' : status === 'learned' ? 'изучён' : 'новый'}`}
                    >
                      <FitText
                        className="kana-char"
                        text={seed.kana}
                        maxFontSize={40}
                        minFontSize={16}
                      />
                      <span className="kana-romaji">{seed.romaji}</span>
                      {hasMnemonic && (
                        <Icon name="bulb" size={13} className="kana-bulb" />
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <p className="kana-legend">
        <span className="kana-legend-dot kana-cell--new" /> новое
        &nbsp;·&nbsp;
        <span className="kana-legend-dot kana-cell--due" /> к повторению
        &nbsp;·&nbsp;
        <span className="kana-legend-dot kana-cell--learned" /> изучено
        &nbsp;·&nbsp;
        <Icon name="bulb" size={13} className="kana-legend-icon" /> есть мнемоника
      </p>
    </div>
  )
}
