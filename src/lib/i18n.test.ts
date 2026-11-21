import { describe, expect, it } from 'vitest'
import {
  getLocaleInfo,
  isLocaleCode,
  loadLocale,
  translateIn,
  type Locale,
} from './i18n'

const ru: Locale = {
  code: 'ru',
  name: 'Русский',
  intl: 'ru-RU',
  messages: {
    'count.cards.one': '{n} карточка',
    'count.cards.few': '{n} карточки',
    'count.cards.many': '{n} карточек',
    'count.cards.other': '{n} карточки',
    greeting: 'Привет, {name}',
  },
}

describe('isLocaleCode', () => {
  it('знает доступные языки', () => {
    expect(isLocaleCode('en')).toBe(true)
    expect(isLocaleCode('ru')).toBe(true)
    expect(isLocaleCode('es')).toBe(true)
    expect(isLocaleCode('de')).toBe(false)
    expect(isLocaleCode(null)).toBe(false)
  })
})

describe('getLocaleInfo', () => {
  it('возвращает метаданные языка', () => {
    expect(getLocaleInfo('ru').intl).toBe('ru-RU')
    expect(getLocaleInfo('es').code).toBe('es')
  })

  it('падает обратно на английский для неизвестного языка', () => {
    expect(getLocaleInfo('de').code).toBe('en')
    expect(getLocaleInfo(undefined).code).toBe('en')
  })
})

describe('translateIn', () => {
  it('подставляет параметры', () => {
    expect(translateIn(ru, 'greeting', { name: 'Мир' })).toBe('Привет, Мир')
  })

  it('выбирает правильную форму множественного числа', () => {
    expect(translateIn(ru, 'count.cards', { n: 1 })).toBe('1 карточка')
    expect(translateIn(ru, 'count.cards', { n: 2 })).toBe('2 карточки')
    expect(translateIn(ru, 'count.cards', { n: 5 })).toBe('5 карточек')
    expect(translateIn(ru, 'count.cards', { n: 21 })).toBe('21 карточка')
  })

  it('падает обратно на английскую строку', () => {
    expect(translateIn(ru, 'brand.name')).toBe('Kotoba')
  })

  it('возвращает ключ, если перевода нет нигде', () => {
    expect(translateIn(ru, 'missing.key')).toBe('missing.key')
  })
})

describe('loadLocale', () => {
  it('загружает русские и испанские строки', async () => {
    const russian = await loadLocale('ru')
    const spanish = await loadLocale('es')
    expect(russian.messages['settings.title']).toBeTruthy()
    expect(spanish.messages['settings.title']).toBeTruthy()
  })
})
