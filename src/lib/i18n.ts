/**
 * Локализация приложения.
 *
 * Файлы локалей лежат в `src/locales/*.ts` и подхватываются автоматически:
 * чтобы добавить новый язык, достаточно создать там файл с объектом Locale.
 */

export type TranslateParams = Record<string, string | number>

export interface Locale {
  /** Код языка: используется в настройках и атрибуте lang. */
  code: string
  /** Название языка на нём самом — показывается в списке выбора. */
  name: string
  /** Локаль для Intl (даты, числа, склонения). */
  intl: string
  messages: Record<string, string>
}

export type Translate = (key: string, params?: TranslateParams) => string

const modules = import.meta.glob('../locales/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>

function isLocale(value: unknown): value is Locale {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<Locale>
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.intl === 'string' &&
    typeof candidate.messages === 'object' &&
    candidate.messages !== null
  )
}

function collectLocales(): Locale[] {
  const found = new Map<string, Locale>()
  for (const module of Object.values(modules)) {
    for (const value of Object.values(module)) {
      if (isLocale(value)) found.set(value.code, value)
    }
  }
  return [...found.values()].sort((a, b) => a.code.localeCompare(b.code))
}

/** Все доступные локали приложения. */
export const LOCALES: Locale[] = collectLocales()

/** Язык по умолчанию. */
export const DEFAULT_LOCALE = 'ru'

export function getLocale(code: string | undefined | null): Locale {
  return (
    LOCALES.find((locale) => locale.code === code) ??
    LOCALES.find((locale) => locale.code === DEFAULT_LOCALE) ??
    LOCALES[0]
  )
}

export function isLocaleCode(code: unknown): code is string {
  return typeof code === 'string' && LOCALES.some((locale) => locale.code === code)
}

let activeLocale = getLocale(DEFAULT_LOCALE)

/** Запоминает язык, который сейчас показывается в интерфейсе. */
export function setActiveLocale(code: string): void {
  activeLocale = getLocale(code)
}

export function getActiveLocale(): Locale {
  return activeLocale
}

function lookup(locale: Locale, key: string): string | undefined {
  const value = locale.messages[key]
  if (typeof value === 'string') return value
  if (locale.code !== DEFAULT_LOCALE) {
    const fallback = getLocale(DEFAULT_LOCALE).messages[key]
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
    /* если Intl не знает локаль — используем обычный ключ */
  }
  return key
}

/**
 * Возвращает перевод с подстановкой параметров.
 * Для числительных достаточно передать `n`: будет выбрана правильная форма
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

/** Перевод для текущего активного языка (для функций вне React). */
export function translate(key: string, params?: TranslateParams): string {
  return translateIn(activeLocale, key, params)
}

/** Проверяет, есть ли перевод для ключа. */
export function hasMessage(key: string, locale: Locale = activeLocale): boolean {
  return lookup(locale, key) !== undefined
}
