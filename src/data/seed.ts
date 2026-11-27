import type { Card, Deck, StudySet, TrashEntry } from '../types'
import { freshSrs } from '../lib/srs'
import { detectSystemLocale } from '../lib/i18n'
import { detectKanaScript } from '../lib/kana-script'
import {
  HIRAGANA_BASIC,
  HIRAGANA_VOICED,
  KATAKANA_BASIC,
  KATAKANA_VOICED,
  type KanaSeed,
} from './kana'

function createSeedDecks(now = Date.now()): Deck[] {
  return [
    {
      id: 'hiragana',
      name: '',
      nameJp: 'ひらがな',
      description: '',
      accent: '#E1523D',
      builtin: true,
      kind: 'kana',
      createdAt: now,
    },
    {
      id: 'katakana',
      name: '',
      nameJp: 'カタカナ',
      description: '',
      accent: '#4A5FC1',
      builtin: true,
      kind: 'kana',
      createdAt: now,
    },
  ]
}

export function createBaseSeedData(now = Date.now()) {
  const decks = createSeedDecks(now)
  const cards: Card[] = [
    ...seedCards('hiragana', 'hira', HIRAGANA_BASIC, 'basic', 1, now),
    ...seedCards('hiragana', 'hira', HIRAGANA_VOICED, 'voiced', 101, now),
    ...seedCards('katakana', 'kata', KATAKANA_BASIC, 'basic', 1, now),
    ...seedCards('katakana', 'kata', KATAKANA_VOICED, 'voiced', 101, now),
  ]

  return {
    version: 2 as const,
    decks,
    cards,
    texts: [],
    studySets: [] as StudySet[],
    installedPacks: [] as string[],
    trash: [] as TrashEntry[],
    history: {} as Record<string, { reviews: number; correct: number; newCards: number; ms: number }>,
    settings: {
      theme: 'system' as const,
      newPerDay: 10,
      defaultTranscription: 'romaji' as const,
      studyMode: 'reading' as const,
      writingDifficulty: 'normal' as const,
      dailyGoalType: 'reviews' as const,
      dailyReviewGoal: 20,
      dailyMinuteGoal: 15,
      goalReviews: 1000,
      goalCards: 100,
      goalStreak: 30,
      sessionSize: 0,
      sessionOrder: 'reviews-first' as const,
      dayStartHour: 0,
      leechThreshold: 0,
      ttsVoiceURI: null,
      ttsRate: 0.85,
      ttsAutoplay: 'off' as const,
      duplicateAction: 'ask' as const,
      zenAuto: true,
      zenIdleMinutes: 5,
      language: detectSystemLocale(),
      onboardingDone: false,
      tourDone: false,
      autoBackup: 'daily' as const,
      backupFolder: null,
      trashRetentionDays: 10,
    },
    createdAt: now,
  }
}

export function createSeedData(now = Date.now()) {
  // Kanji packs are installed lazily after the app shell is ready,
  // so their data does not end up in the initial JavaScript bundle.
  return createBaseSeedData(now)
}

function seedCards(
  deckId: string,
  prefix: string,
  seeds: KanaSeed[],
  group: 'basic' | 'voiced',
  startIndex: number,
  now: number,
): Card[] {
  return seeds.map((seed, index) => ({
    id: `${prefix}-${group}-${index + 1}`,
    deckId,
    front: seed.kana,
    reading: seed.romaji,
    meaning: '',
    note: '',
    mnemonic: '',
    tags: [],
    script: detectKanaScript(seed.kana) ?? undefined,
    readings: [],
    examples: [],
    group,
    order: startIndex + index,
    srs: freshSrs(),
    createdAt: now,
  }))
}
