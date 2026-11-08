import type { Card, Deck } from '../types'
import { freshSrs } from '../lib/srs'
import {
  HIRAGANA_BASIC,
  HIRAGANA_VOICED,
  KATAKANA_BASIC,
  KATAKANA_VOICED,
} from './kana'

export interface SeedKana {
  kana: string
  romaji: string
  example?: string
  translation?: string
  note?: string
}

export function createSeedDecks(now = Date.now()): Deck[] {
  return [
    {
      id: 'hiragana',
      name: 'Хирагана',
      nameJp: 'ひらがな',
      description: 'Основа японской письменности: 46 знаков и озвончённые варианты.',
      accent: '#E1523D',
      builtin: true,
      createdAt: now,
    },
    {
      id: 'katakana',
      name: 'Катакана',
      nameJp: 'カタカナ',
      description: 'Для заимствованных слов: 46 знаков и озвончённые варианты.',
      accent: '#4A5FC1',
      builtin: true,
      createdAt: now,
    },
  ]
}

export function createSeedData(now = Date.now()) {
  const decks = createSeedDecks(now)
  const cards: Card[] = [
    ...seedCards('hiragana', 'hira', HIRAGANA_BASIC, 'basic', 1, now),
    ...seedCards('hiragana', 'hira', HIRAGANA_VOICED, 'voiced', 101, now),
    ...seedCards('katakana', 'kata', KATAKANA_BASIC, 'basic', 1, now),
    ...seedCards('katakana', 'kata', KATAKANA_VOICED, 'voiced', 101, now),
  ]

  return {
    version: 1 as const,
    decks,
    cards,
    history: {} as Record<string, { reviews: number; correct: number; newCards: number; ms: number }>,
    settings: {
      theme: 'system' as const,
      newPerDay: 10,
      defaultTranscription: 'romaji' as const,
      studyMode: 'reading' as const,
      writingDifficulty: 'normal' as const,
    },
    createdAt: now,
  }
}

function seedCards(
  deckId: string,
  prefix: string,
  seeds: SeedKana[],
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
    note: seed.note ?? (seed.example ? `${seed.example} — ${seed.translation ?? ''}` : ''),
    mnemonic: '',
    tags: [],
    group,
    order: startIndex + index,
    srs: freshSrs(),
    createdAt: now,
  }))
}
