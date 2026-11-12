import { DAY } from './srs'
import { getActiveLocale, translate } from './i18n'

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function dayKey(ts: number, dayStartHour = 0): string {
  const d = new Date(ts)
  if (dayStartHour > 0) {
    d.setTime(d.getTime() - dayStartHour * 60 * 60 * 1000)
  }
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

export function formatDate(ts: number, dayStartHour = 0): string {
  const date = new Date(ts)
  if (dayStartHour > 0) {
    date.setTime(date.getTime() - dayStartHour * 60 * 60 * 1000)
  }
  const text = new Intl.DateTimeFormat(getActiveLocale().intl, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function greeting(ts = Date.now()): string {
  const hour = new Date(ts).getHours()
  if (hour < 5) return translate('greeting.night')
  if (hour < 12) return translate('greeting.morning')
  if (hour < 18) return translate('greeting.afternoon')
  return translate('greeting.evening')
}

export function dueLabel(due: number, introduced: boolean, now = Date.now()): string {
  if (!introduced) return translate('due.new')
  const diff = due - now
  if (diff <= 60_000) return translate('due.now')
  if (diff < 3_600_000) {
    const n = Math.ceil(diff / 60_000)
    return translate('due.minutes', { n })
  }
  if (diff < DAY) {
    const n = Math.ceil(diff / 3_600_000)
    return translate('due.hours', { n })
  }
  const days = Math.ceil(diff / DAY)
  if (days === 1) return translate('due.tomorrow')
  if (days < 30) return translate('due.inDays', { n: days })
  const n = Math.round(days / 30)
  return translate('due.inMonths', { n })
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes === 0) return translate('duration.seconds', { s: seconds })
  return translate('duration.minutes', { m: minutes, s: String(seconds).padStart(2, '0') })
}
