import type { Route } from '../types'

interface TourStep {
  id: string
  titleKey: string
  textKey: string
  /** Раздел, который тур открывает перед показом шага. */
  route?: Route
  /** Пункт бокового меню, который подсвечивается. */
  nav: string
  /** Подсвечивать ли основную область раздела. */
  content: boolean
}

/** Маршрут тура: по одному шагу на раздел, Дзен показываем только в меню. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'study',
    titleKey: 'tour.studyTitle',
    textKey: 'tour.studyText',
    route: { name: 'home' },
    nav: 'home',
    content: true,
  },
  {
    id: 'kana',
    titleKey: 'tour.kanaTitle',
    textKey: 'tour.kanaText',
    route: { name: 'decks' },
    nav: 'decks',
    content: true,
  },
  {
    id: 'kanji',
    titleKey: 'tour.kanjiTitle',
    textKey: 'tour.kanjiText',
    route: { name: 'kanji' },
    nav: 'kanji',
    content: true,
  },
  {
    id: 'cards',
    titleKey: 'tour.cardsTitle',
    textKey: 'tour.cardsText',
    route: { name: 'cards' },
    nav: 'cards',
    content: true,
  },
  {
    id: 'problems',
    titleKey: 'tour.problemsTitle',
    textKey: 'tour.problemsText',
    route: { name: 'problems' },
    nav: 'problems',
    content: true,
  },
  {
    id: 'kanamap',
    titleKey: 'tour.kanamapTitle',
    textKey: 'tour.kanamapText',
    route: { name: 'kanamap' },
    nav: 'kanamap',
    content: true,
  },
  {
    id: 'stats',
    titleKey: 'tour.statsTitle',
    textKey: 'tour.statsText',
    route: { name: 'stats' },
    nav: 'stats',
    content: true,
  },
  {
    id: 'data',
    titleKey: 'tour.dataTitle',
    textKey: 'tour.dataText',
    route: { name: 'data' },
    nav: 'data',
    content: true,
  },
  {
    id: 'zen',
    titleKey: 'tour.zenTitle',
    textKey: 'tour.zenText',
    nav: 'zen',
    content: false,
  },
  {
    id: 'settings',
    titleKey: 'tour.settingsTitle',
    textKey: 'tour.settingsText',
    route: { name: 'settings' },
    nav: 'settings',
    content: true,
  },
  {
    id: 'help',
    titleKey: 'tour.helpTitle',
    textKey: 'tour.helpText',
    route: { name: 'help' },
    nav: 'help',
    content: true,
  },
]

/** Приветствие и финальный экран входят в общее число шагов. */
export const TOUR_TOTAL = TOUR_STEPS.length + 1
