import type { StudyMode, TtsAutoplay } from '../types'

export type TtsFailureReason = 'unsupported' | 'missing-voice' | 'error'

export type TtsResult = { ok: true } | { ok: false; reason: TtsFailureReason }

export interface TtsErrorDetail {
  reason: TtsFailureReason
}

export const TTS_ERROR_EVENT = 'kotoba:tts-error'

export interface TtsPreferences {
  /** voiceURI выбранного голоса; null — автоматический выбор. */
  voiceURI: string | null
  rate: number
}

const DEFAULT_PREFERENCES: TtsPreferences = { voiceURI: null, rate: 0.85 }
let preferences: TtsPreferences = { ...DEFAULT_PREFERENCES }
let pendingVoices: Promise<SpeechSynthesisVoice[]> | null = null

/** Настройки применяются глобально: озвучка вызывается из разных экранов. */
export function setTtsPreferences(next: Partial<TtsPreferences>): void {
  preferences = { ...preferences, ...next }
}

export function getTtsPreferences(): TtsPreferences {
  return preferences
}

/** Нужно ли озвучивать карточку при перевороте в текущем режиме. */
export function ttsAutoplayEnabled(autoplay: TtsAutoplay, mode: StudyMode): boolean {
  return autoplay === 'always' || (autoplay === 'reading' && mode === 'reading')
}

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

function voiceId(voice: SpeechSynthesisVoice): string {
  return voice.voiceURI || voice.name
}

function japaneseVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith('ja'))
    .sort((a, b) => Number(b.localService) - Number(a.localService))
}

function pickJapaneseVoice(
  voices: SpeechSynthesisVoice[],
  preferredVoiceURI: string | null,
): SpeechSynthesisVoice | null {
  const japanese = japaneseVoices(voices)
  if (preferredVoiceURI) {
    const preferred = japanese.find((voice) => voiceId(voice) === preferredVoiceURI)
    if (preferred) return preferred
  }
  return japanese[0] ?? null
}

/** Все установленные японские голоса — для выбора в настройках. */
export async function getJapaneseVoices(): Promise<SpeechSynthesisVoice[]> {
  return japaneseVoices(await loadVoices())
}

/** Эффективный голос с учётом выбранного в настройках. */
export async function getJapaneseVoice(): Promise<SpeechSynthesisVoice | null> {
  return pickJapaneseVoice(await loadVoices(), preferences.voiceURI)
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
export async function speakJa(
  text: string,
  options: { reportErrors?: boolean } = {},
): Promise<TtsResult> {
  const value = text.trim()
  if (!value) return { ok: true }

  const reportErrors = options.reportErrors !== false
  const synth = getSynth()
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    if (reportErrors) report('unsupported')
    return { ok: false, reason: 'unsupported' }
  }

  const voice = await getJapaneseVoice()
  if (!voice) {
    if (reportErrors) report('missing-voice')
    return { ok: false, reason: 'missing-voice' }
  }

  try {
    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = voice.lang || 'ja-JP'
    utterance.voice = voice
    utterance.rate = Math.min(1.5, Math.max(0.5, preferences.rate))
    utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') return
      if (reportErrors) report('error')
    }
    synth.cancel()
    synth.speak(utterance)
    return { ok: true }
  } catch {
    report('error')
    return { ok: false, reason: 'error' }
  }
}
