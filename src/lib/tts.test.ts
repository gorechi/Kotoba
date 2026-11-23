import { describe, expect, it } from 'vitest'
import { ttsAutoplayEnabled } from './tts'

describe('ttsAutoplayEnabled', () => {
  it('по умолчанию выключен', () => {
    expect(ttsAutoplayEnabled('off', 'reading')).toBe(false)
    expect(ttsAutoplayEnabled('off', 'writing')).toBe(false)
  })

  it('в режиме «только в чтении» не срабатывает при письме', () => {
    expect(ttsAutoplayEnabled('reading', 'reading')).toBe(true)
    expect(ttsAutoplayEnabled('reading', 'writing')).toBe(false)
  })

  it('в режиме «всегда» срабатывает в обоих режимах', () => {
    expect(ttsAutoplayEnabled('always', 'reading')).toBe(true)
    expect(ttsAutoplayEnabled('always', 'writing')).toBe(true)
  })
})
