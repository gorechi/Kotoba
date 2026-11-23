import type {
  AppData,
  Card,
  DayStat,
  Deck,
  DeckStudySettings,
  Settings,
  SrsState,
  StudyTotals,
} from '../types'
import { freshSrs } from '../lib/srs'

export function makeSrs(patch: Partial<SrsState> = {}): SrsState {
  return { ...freshSrs(), ...patch }
}

export function makeTotals(patch: Partial<StudyTotals> = {}): StudyTotals {
  return { reviews: 0, correct: 0, newCards: 0, ms: 0, ...patch }
}

export function makeDayStat(patch: Partial<DayStat> = {}): DayStat {
  return { ...makeTotals(), ...patch }
}

export function makeDeck(patch: Partial<Deck> = {}): Deck {
  return {
    id: 'deck-1',
    name: 'Test deck',
    nameJp: 'テスト',
    description: '',
    accent: '#E1523D',
    builtin: false,
    kind: 'kana',
    createdAt: 0,
    ...patch,
  }
}

export function makeDeckSettings(patch: Partial<DeckStudySettings> = {}): DeckStudySettings {
  return {
    newPerDay: null,
    reviewLimit: null,
    sessionSize: null,
    sessionOrder: null,
    order: 'order',
    allowNew: true,
    studyMode: 'global',
    ...patch,
  }
}

export function makeCard(patch: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    deckId: 'deck-1',
    front: 'ひらがな',
    reading: 'hiragana',
    meaning: 'hiragana',
    note: '',
    mnemonic: '',
    tags: [],
    readings: [],
    examples: [],
    group: 'custom',
    order: 0,
    srs: makeSrs(),
    createdAt: 0,
    ...patch,
  }
}

export function makeSettings(patch: Partial<Settings> = {}): Settings {
  return {
    theme: 'light',
    newPerDay: 10,
    defaultTranscription: 'romaji',
    studyMode: 'reading',
    writingDifficulty: 'normal',
    dailyGoalType: 'reviews',
    dailyReviewGoal: 20,
    dailyMinuteGoal: 15,
    goalReviews: 1000,
    goalCards: 100,
    goalStreak: 30,
    sessionSize: 0,
    sessionOrder: 'reviews-first',
    dayStartHour: 0,
    leechThreshold: 0,
    ttsVoiceURI: null,
    ttsRate: 0.85,
    ttsAutoplay: 'off',
    duplicatePolicy: { ignoreAll: false, withinDeck: 'ask', acrossDecks: 'ignore' },
    zenAuto: true,
    zenIdleMinutes: 5,
    language: 'en',
    onboardingDone: true,
    autoBackup: 'daily',
    backupFolder: null,
    trashRetentionDays: 10,
    ...patch,
  }
}

export function makeData(patch: Partial<AppData> = {}): AppData {
  return {
    version: 2,
    decks: [makeDeck()],
    cards: [makeCard()],
    studySets: [],
    installedPacks: [],
    trash: [],
    history: {},
    settings: makeSettings(),
    createdAt: 0,
    ...patch,
  }
}
