import { describe, expect, it } from 'vitest'
import { messages as en } from './ui/en'
import { messages as es } from './ui/es'
import { messages as ru } from './ui/ru'

const enKeys = Object.keys(en)
const PLURAL = /\.(one|few|many|other)$/
const pluralBase = (key: string) => key.replace(PLURAL, '')
const enPluralBases = [...new Set(enKeys.filter((key) => PLURAL.test(key)).map(pluralBase))]
const enPlainKeys = enKeys.filter((key) => !PLURAL.test(key))

/**
 * Языки используют разные наборы форм множественного числа, поэтому
 * проверяем не буквальное совпадение ключей, а наличие базовой строки:
 * переводчик берёт форму по Intl.PluralRules с запасным `.other`/`.one`.
 */
function missingKeys(target: Record<string, string>): string[] {
  const keys = new Set(Object.keys(target))
  const missingPlain = enPlainKeys.filter((key) => !keys.has(key))
  const missingPlural = enPluralBases
    .filter((base) => !keys.has(`${base}.other`) && !keys.has(`${base}.one`))
    .map((base) => `${base}.one|other`)
  return [...missingPlain, ...missingPlural]
}

describe('локали интерфейса', () => {
  it('русская локаль содержит все английские строки', () => {
    expect(missingKeys(ru)).toEqual([])
  })

  it('испанская локаль содержит все английские строки', () => {
    expect(missingKeys(es)).toEqual([])
  })

  it('ни одна строка не пустая', () => {
    for (const [code, messages] of [
      ['en', en],
      ['ru', ru],
      ['es', es],
    ] as const) {
      const empty = Object.entries(messages)
        .filter(([, value]) => !String(value).trim())
        .map(([key]) => `${code}:${key}`)
      expect(empty).toEqual([])
    }
  })
})

