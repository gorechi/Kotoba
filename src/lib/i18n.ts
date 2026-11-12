import { messages as enUi } from '../locales/ui/en'

/**
 * Локали устроены так:
 * - метаданные (код, название, Intl) лежат в этом файле и всегда доступны;
 * - UI-строки и контентные переводы лежат отдельными чанками;
 * - активный язык загружается при старте, неактивные — только при переключении.
 */
export type TranslateParams = Record<string, string | number>

export interface LocaleInfo {
  code: string
  name: string
  intl: string
}

export interface Locale extends LocaleInfo {
  messages: Record<string, string>
}

export type Translate = (key: string, params?: TranslateParams) => string

export const LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', intl: 'en-US' },
  { code: 'ru', name: 'Русский', intl: 'ru-RU' },
  { code: 'es', name: 'Español', intl: 'es-ES' },
]

export const DEFAULT_LOCALE = 'en'

/** Первый поддерживаемый язык из системных настроек браузера/Windows. */
export function detectSystemLocale(): string {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const tags = [...(navigator.languages ?? []), navigator.language]
  for (const tag of tags) {
    if (!tag) continue
    const base = String(tag).toLowerCase().split('-')[0]
    const match = LOCALES.find((locale) => locale.code === base)
    if (match) return match.code
  }
  return DEFAULT_LOCALE
}

type MessageModule = { messages: Record<string, string> }

// UI-строки неактивных языков подгружаются отдельно. UI английского
// остаётся статическим фолбэком и не тянет за собой контентные переводы.
const uiLoaders: Record<string, () => Promise<MessageModule>> = {
  ru: () => import('../locales/ui/ru'),
  es: () => import('../locales/ui/es'),
}

const contentLoaders: Record<string, () => Promise<MessageModule>> = {
  en: () => import('../locales/content/en'),
  ru: () => import('../locales/content/ru'),
  es: () => import('../locales/content/es'),
}

const loadedLocales = new Map<string, Locale>()

export function getLocaleInfo(code: string | undefined | null): LocaleInfo {
  return (
    LOCALES.find((locale) => locale.code === code) ??
    LOCALES.find((locale) => locale.code === DEFAULT_LOCALE) ??
    LOCALES[0]
  )
}

/** Возвращает загруженную локаль или метаданные с английским UI-фолбэком. */
export function getLocale(code: string | undefined | null): Locale {
  const info = getLocaleInfo(code)
  return (
    loadedLocales.get(info.code) ?? {
      ...info,
      messages: info.code === DEFAULT_LOCALE ? enUi : {},
    }
  )
}

export function isLocaleCode(code: unknown): code is string {
  return typeof code === 'string' && LOCALES.some((locale) => locale.code === code)
}

export function getLoadedLocale(code: string | undefined | null): Locale | undefined {
  return loadedLocales.get(getLocaleInfo(code).code)
}

/** Загружает UI и контентные строки языка. Повторные вызовы берут кэш. */
export async function loadLocale(code: string | undefined | null): Promise<Locale> {
  const info = getLocaleInfo(code)
  const cached = loadedLocales.get(info.code)
  if (cached) return cached

  const uiLoader = info.code === DEFAULT_LOCALE ? null : uiLoaders[info.code]
  const contentLoader = contentLoaders[info.code]
  if ((!uiLoader && info.code !== DEFAULT_LOCALE) || !contentLoader) {
    throw new Error(`Locale bundle is not available: ${info.code}`)
  }

  const [ui, content] = await Promise.all([
    uiLoader ? uiLoader() : Promise.resolve({ messages: enUi }),
    contentLoader(),
  ])

  const locale: Locale = {
    ...info,
    messages: { ...content.messages, ...ui.messages },
  }
  loadedLocales.set(info.code, locale)
  return locale
}

let activeLocale: Locale = {
  ...getLocaleInfo(DEFAULT_LOCALE),
  messages: enUi,
}

export function setActiveLocale(locale: Locale | string): void {
  activeLocale = typeof locale === 'string' ? getLocale(locale) : locale
}

export function getActiveLocale(): Locale {
  return activeLocale
}

function lookup(locale: Locale, key: string): string | undefined {
  const value = locale.messages[key]
  if (typeof value === 'string') return value
  if (locale.code !== DEFAULT_LOCALE) {
    const fallback = enUi[key]
    if (typeof fallback === 'string') return fallback
  }
  return undefined
}

function pluralKey(locale: Locale, key: string, count: number): string {
  try {
    const category = new Intl.PluralRules(locale.intl).select(count)
    const candidates = [`${key}.${category}`, `${key}.other`, `${key}.one`]
    for (const candidate of candidates) {
      if (lookup(locale, candidate) !== undefined) return candidate
    }
  } catch {
    /* Если Intl не знает язык - используем базовый ключ. */
  }
  return key
}

/**
 * Перевод строки с подстановкой параметров.
 * Если у параметра есть `n`, будет выбрана правильная форма
 * (`key.one`, `key.few`, `key.many` или `key.other`).
 */
export function translateIn(locale: Locale, key: string, params?: TranslateParams): string {
  const count = params?.n
  const resolvedKey = typeof count === 'number' ? pluralKey(locale, key, count) : key
  const template = lookup(locale, resolvedKey) ?? lookup(locale, key) ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in params ? String(params[token]) : match,
  )
}

/** Перевод для текущего активного языка (не-React код). */
export function translate(key: string, params?: TranslateParams): string {
  return translateIn(activeLocale, key, params)
}
