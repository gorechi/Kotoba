import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  createContext,
  useState,
  type ReactNode,
} from 'react'
import type { Locale, LocaleInfo, Translate, TranslateParams } from './i18n'
import {
  DEFAULT_LOCALE,
  LOCALES,
  getLoadedLocale,
  getLocaleInfo,
  isLocaleCode,
  loadLocale,
  setActiveLocale,
  translateIn,
} from './i18n'
import { useStore } from '../state/store'
import { Splash } from '../components/Splash'

interface I18nValue {
  /** Текущая локаль. */
  locale: Locale
  /** Все доступные языки. */
  locales: LocaleInfo[]
  /** Выбранный язык. */
  language: string
  /** Переключение языка. */
  setLanguage: (code: string) => void
  /** Перевод на текущий язык. */
  t: Translate
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data, setSettings } = useStore()
  const language = isLocaleCode(data.settings.language)
    ? data.settings.language
    : DEFAULT_LOCALE
  const [locale, setLocale] = useState<Locale | null>(() => getLoadedLocale(language) ?? null)

  useEffect(() => {
    let cancelled = false
    const target = getLocaleInfo(language)
    const cached = getLoadedLocale(target.code)
    if (cached) {
      setLocale(cached)
      setActiveLocale(cached)
      return
    }

    void loadLocale(target.code)
      .then((next) => {
        if (cancelled) return
        setLocale(next)
        setActiveLocale(next)
      })
      .catch((error) => {
        console.error('[kotoba] locale load failed', error)
        void loadLocale(DEFAULT_LOCALE)
          .then((fallback) => {
            if (cancelled) return
            setLocale(fallback)
            setActiveLocale(fallback)
          })
          .catch((fallbackError) => {
            console.error('[kotoba] fallback locale load failed', fallbackError)
          })
      })

    return () => {
      cancelled = true
    }
  }, [language])

  useEffect(() => {
    if (locale) document.documentElement.lang = locale.code
  }, [locale])

  const t = useCallback<Translate>(
    (key: string, params?: TranslateParams) => translateIn(locale as Locale, key, params),
    [locale],
  )

  const setLanguage = useCallback(
    (code: string) => {
      if (!isLocaleCode(code)) return
      setSettings({ language: code })
    },
    [setSettings],
  )

  const value = useMemo<I18nValue | null>(() => {
    if (!locale) return null
    return { locale, locales: LOCALES, language, setLanguage, t }
  }, [locale, language, setLanguage, t])

  if (!value) return <Splash />

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
