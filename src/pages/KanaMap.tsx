import { useCallback, useMemo } from 'react'
import type { Card } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
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
  labelKey: string
  labelJp: string
  seeds: { kana: string; romaji: string }[]
}

const SECTIONS: KanaSection[] = [
  {
    id: 'hiragana',
    labelKey: 'kana.hiragana',
    labelJp: 'ひらがな',
    seeds: [...HIRAGANA_BASIC, ...HIRAGANA_VOICED].map((s) => ({ kana: s.kana, romaji: s.romaji })),
  },
  {
    id: 'katakana',
    labelKey: 'kana.katakana',
    labelJp: 'カタカナ',
    seeds: [...KATAKANA_BASIC, ...KATAKANA_VOICED].map((s) => ({ kana: s.kana, romaji: s.romaji })),
  },
]

export function KanaMap({ onStudyCard }: { onStudyCard: (cardId: string, deckId: string) => void }) {
  const { data } = useStore()
  const { t } = useI18n()
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

  const statusLabel = (status: 'new' | 'due' | 'learned') =>
    status === 'due'
      ? t('kanaMap.statusDue')
      : status === 'learned'
        ? t('kanaMap.statusLearned')
        : t('kanaMap.statusNew')

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
          <div className="eyebrow">{t('kanaMap.eyebrow')}</div>
          <h1>{t('kanaMap.title')}</h1>
          <p className="page-sub">{t('kanaMap.subtitle')}</p>
        </div>
      </header>

      <div className="kana-map-stats">
        <div className="kana-map-stat">
          <strong>{totalChars}</strong>
          <span>{t('kanaMap.signs')}</span>
        </div>
        <div className="kana-map-stat">
          <strong style={{ color: 'var(--green)' }}>{totalLearned}</strong>
          <span>{t('kanaMap.learned')}</span>
        </div>
        <div className="kana-map-stat">
          <strong style={{ color: 'var(--red)' }}>{totalDue}</strong>
          <span>{t('kanaMap.due')}</span>
        </div>
        <div className="kana-map-stat">
          <strong>{totalFresh}</strong>
          <span>{t('kanaMap.new')}</span>
        </div>
      </div>

      <div className="kana-grid-wrap">
        {SECTIONS.map((section) => {
          const stat = sectionStat(section.seeds, section.id)
          const learnedPct = stat.total ? Math.round((stat.learned / stat.total) * 100) : 0

          return (
            <section className="kana-section" key={section.id}>
              <div className="kana-section-head">
                <h2>{t(section.labelKey)}</h2>
                <span className="kana-section-jp" aria-hidden="true">
                  {section.labelJp}
                </span>
              </div>
              <div className="kana-section-stats">
                <span>{t('kanaMap.learnedOf', { learned: stat.learned, total: stat.total })}</span>{' '}
                <span>
                  <b style={{ color: 'var(--red)' }}>{stat.due}</b> {t('kanaMap.statusDue')}
                </span>{' '}
                <span>
                  <b>{stat.fresh}</b> {t('kanaMap.new')}
                </span>{' '}
                <span>
                  <b>{learnedPct}%</b> {t('kanaMap.progressLabel')}
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
                          ? t('kanaMap.notFound')
                          : t('kanaMap.tooltip', {
                              kana: seed.kana,
                              romaji: seed.romaji,
                              status: statusLabel(status),
                            }) + (hasMnemonic ? t('kanaMap.hasMnemonic') : '')
                      }
                      aria-label={`${seed.kana} — ${statusLabel(status)}`}
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
        <span className="kana-legend-dot kana-cell--new" /> {t('kanaMap.legendNew')}
        &nbsp;·&nbsp;
        <span className="kana-legend-dot kana-cell--due" /> {t('kanaMap.legendDue')}
        &nbsp;·&nbsp;
        <span className="kana-legend-dot kana-cell--learned" /> {t('kanaMap.legendLearned')}
        &nbsp;·&nbsp;
        <Icon name="bulb" size={13} className="kana-legend-icon" /> {t('kanaMap.legendMnemonic')}
      </p>
    </div>
  )
}
