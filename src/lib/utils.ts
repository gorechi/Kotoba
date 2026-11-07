import { DAY, plural } from './srs'

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function dayKey(ts: number): string {
  const d = new Date(ts)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function formatDateRu(ts: number): string {
  const text = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(ts))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function greeting(ts = Date.now()): string {
  const hour = new Date(ts).getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function dueLabel(due: number, introduced: boolean, now = Date.now()): string {
  if (!introduced) return 'новое'
  const diff = due - now
  if (diff <= 60_000) return 'к повторению'
  if (diff < 3_600_000) {
    const m = Math.ceil(diff / 60_000)
    return `через ${m} мин`
  }
  if (diff < DAY) {
    const h = Math.ceil(diff / 3_600_000)
    return `через ${h} ч`
  }
  const days = Math.ceil(diff / DAY)
  if (days === 1) return 'завтра'
  if (days < 30) return `через ${days} ${plural(days, 'день', 'дня', 'дней')}`
  const months = Math.round(days / 30)
  return `через ${months} мес`
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes === 0) return `${seconds} с`
  return `${minutes} мин ${String(seconds).padStart(2, '0')} с`
}

export function speakJa(text: string): void {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.85
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('ja'))
    if (voice) utterance.voice = voice
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  } catch {
    /* озвучка недоступна — не мешаем работе */
  }
}
