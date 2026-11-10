export type TtsFailureReason = 'unsupported' | 'missing-voice' | 'error'

export type TtsResult = { ok: true } | { ok: false; reason: TtsFailureReason }

export interface TtsErrorDetail {
  reason: TtsFailureReason
}

export const TTS_ERROR_EVENT = 'kotoba:tts-error'

let pendingVoices: Promise<SpeechSynthesisVoice[]> | null = null

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return window.speechSynthesis ?? null
}

function readVoices(): SpeechSynthesisVoice[] {
  const synth = getSynth()
  if (!synth) return []
  try {
    return synth.getVoices()
  } catch {
    return []
  }
}

function pickJapaneseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const japanese = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ja'))
  return japanese.find((voice) => voice.localService) ?? japanese[0] ?? null
}

export async function getJapaneseVoice(): Promise<SpeechSynthesisVoice | null> {
  return pickJapaneseVoice(await loadVoices())
}

/**
 * Возвращает список голосов, дожидаясь события voiceschanged.
 * В Chromium getVoices() при первом обращении часто пуст: голоса
 * подгружаются асинхронно.
 */
export function loadVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  const synth = getSynth()
  if (!synth) return Promise.resolve([])

  const current = readVoices()
  if (current.length) return Promise.resolve(current)
  if (pendingVoices) return pendingVoices

  pendingVoices = new Promise((resolve) => {
    let settled = false
    let timer: number | undefined

    const finish = () => {
      if (settled) return
      settled = true
      synth.removeEventListener('voiceschanged', onVoicesChanged)
      if (timer !== undefined) window.clearTimeout(timer)
      pendingVoices = null
      resolve(readVoices())
    }

    const onVoicesChanged = () => {
      if (readVoices().length) finish()
    }

    synth.addEventListener('voiceschanged', onVoicesChanged)
    timer = window.setTimeout(finish, timeoutMs)
  })

  return pendingVoices
}

/** Прогревает список голосов, чтобы первый клик не ждал загрузки. */
export function warmUpTts(): void {
  void loadVoices()
}

function report(reason: TtsFailureReason): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<TtsErrorDetail>(TTS_ERROR_EVENT, { detail: { reason } }),
  )
}

/**
 * Озвучивает японский текст системным голосом.
 * Если японского голоса нет, ничего не произносит и сообщает об этом:
 * голос по умолчанию прочитал бы кану/кандзи неправильно или молча.
 */
export async function speakJa(text: string): Promise<TtsResult> {
  const value = text.trim()
  if (!value) return { ok: true }

  const synth = getSynth()
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    report('unsupported')
    return { ok: false, reason: 'unsupported' }
  }

  const voice = await getJapaneseVoice()
  if (!voice) {
    report('missing-voice')
    return { ok: false, reason: 'missing-voice' }
  }

  try {
    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = voice.lang || 'ja-JP'
    utterance.voice = voice
    utterance.rate = 0.85
    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') return
      report('error')
    }
    synth.cancel()
    synth.speak(utterance)
    return { ok: true }
  } catch {
    report('error')
    return { ok: false, reason: 'error' }
  }
}
