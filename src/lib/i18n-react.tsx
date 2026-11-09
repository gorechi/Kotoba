import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  createContext,
  type ReactNode,
} from 'react'
import type { Locale, Translate, TranslateParams } from './i18n'
import {
  LOCALES,
  getLocale,
  setActiveLocale,
  translateIn,
} from './i18n'
import { useStore } from '../state/store'

interface I18nValue {
  /** Текущая локаль. */
  locale: Locale
  /** Все локали, найденные в приложении. */
  locales: Locale[]
  /** Код выбранного языка. */
  language: string
  /** Переключить язык интерфейса. */
  setLanguage: (code: string) => void
  /** Перевод на текущий язык. */
  t: Translate
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data, setSettings } = useStore()
  const language = getLocale(data.settings.language).code
  const locale = getLocale(language)

  // Глобальный активный язык нужен функциям форматирования вне React.
  setActiveLocale(locale.code)

  useEffect(() => {
    document.documentElement.lang = locale.code
  }, [locale.code])

  const t = useCallback<Translate>(
    (key: string, params?: TranslateParams) => translateIn(locale, key, params),
    [locale],
  )

  const setLanguage = useCallback(
    (code: string) => {
      if (!LOCALES.some((item) => item.code === code)) return
      setSettings({ language: code })
    },
    [setSettings],
  )

  const value = useMemo<I18nValue>(
    () => ({ locale, locales: LOCALES, language, setLanguage, t }),
    [locale, language, setLanguage, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
