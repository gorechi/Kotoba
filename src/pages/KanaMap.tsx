import { useMemo } from 'react'
import type { Card } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { Icon } from '../components/Icon'
import {
  HIRAGANA_BASIC,
  HIRAGANA_VOICED,
  KATAKANA_BASIC,
  KATAKANA_VOICED,
} from '../data/kana'

type KanaDeckId = 'hiragana' | 'katakana'
type KanaStatus = 'new' | 'due' | 'learned'

interface KanaSeed {
  kana: string
  romaji: string
}

interface KanaSection {
  id: KanaDeckId
  labelKey: string
  labelJp: string
  seeds: KanaSeed[]
}

interface KanaCell {
  seed: KanaSeed
  card: Card | undefined
  status: KanaStatus
  hasMnemonic: boolean
}

interface SectionView {
  section: KanaSection
  cells: KanaCell[]
  stat: { total: number; learned: number; due: number; fresh: number }
}

const SECTIONS: KanaSection[] = [
  {
    id: 'hiragana',
    labelKey: 'kana.hiragana',
    labelJp: 'ひらがな',
    seeds: [...HIRAGANA_BASIC, ...HIRAGANA_VOICED].map((s) => ({
      kana: s.kana,
      romaji: s.romaji,
    })),
  },
  {
    id: 'katakana',
    labelKey: 'kana.katakana',
    labelJp: 'カタカナ',
    seeds: [...KATAKANA_BASIC, ...KATAKANA_VOICED].map((s) => ({
      kana: s.kana,
      romaji: s.romaji,
    })),
  },
]

/** Ключ не зависит от данных карточки: колода + символ. */
function cardKey(deckId: string, kana: string): string {
  return `${deckId}\u0000${kana}`
}

export function KanaMap({ onStudyCard }: { onStudyCard: (cardId: string, deckId: string) => void }) {
  const { data } = useStore()
  const { t } = useI18n()

  // Карточки каны ищутся по Map, а не линейным перебором на каждую ячейку.
  const cardIndex = useMemo(() => {
    const index = new Map<string, Card>()
    for (const card of data.cards) {
      index.set(cardKey(card.deckId, card.front), card)
    }
    return index
  }, [data.cards])

  // Один проход по 142 знакам: сразу и статусы ячеек, и статистика секций.
  const { sections, totals } = useMemo(() => {
    const now = Date.now()
    let totalLearned = 0
    let totalDue = 0
    let totalFresh = 0
    let totalChars = 0

    const views: SectionView[] = SECTIONS.map((section) => {
      let learned = 0
      let due = 0
      let fresh = 0

      const cells: KanaCell[] = section.seeds.map((seed) => {
        const card = cardIndex.get(cardKey(section.id, seed.kana))
        let status: KanaStatus = 'new'

        if (card) {
          totalChars += 1
          if (!card.srs.introduced) {
            fresh += 1
          } else {
            learned += 1
            if (card.srs.due <= now) {
              due += 1
              status = 'due'
            } else {
              status = 'learned'
            }
          }
        }

        return {
          seed,
          card,
          status,
          hasMnemonic: Boolean(card?.mnemonic?.trim()),
        }
      })

      totalLearned += learned
      totalDue += due
      totalFresh += fresh

      return {
        section,
        cells,
        stat: { total: section.seeds.length, learned, due, fresh },
      }
    })

    return {
      sections: views,
      totals: {
        chars: totalChars,
        learned: totalLearned,
        due: totalDue,
        fresh: totalFresh,
      },
    }
  }, [cardIndex])

  const statusLabel = (status: KanaStatus) =>
    status === 'due'
      ? t('kanaMap.statusDue')
      : status === 'learned'
        ? t('kanaMap.statusLearned')
        : t('kanaMap.statusNew')

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
          <strong>{totals.chars}</strong>
          <span>{t('kanaMap.signs')}</span>
        </div>
        <div className="kana-map-stat">
          <strong style={{ color: 'var(--green)' }}>{totals.learned}</strong>
          <span>{t('kanaMap.learned')}</span>
        </div>
        <div className="kana-map-stat">
          <strong style={{ color: 'var(--red)' }}>{totals.due}</strong>
          <span>{t('kanaMap.due')}</span>
        </div>
        <div className="kana-map-stat">
          <strong>{totals.fresh}</strong>
          <span>{t('kanaMap.new')}</span>
        </div>
      </div>

      <div className="kana-grid-wrap">
        {sections.map(({ section, cells, stat }) => {
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
                {cells.map(({ seed, card, status, hasMnemonic }) => (
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
                    <span className="kana-char">{seed.kana}</span>
                    <span className="kana-romaji">{seed.romaji}</span>
                    {hasMnemonic && <Icon name="bulb" size={13} className="kana-bulb" />}
                  </button>
                ))}
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
