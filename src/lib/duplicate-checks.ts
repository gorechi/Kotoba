import type { DuplicateCheck } from '../types'

export const DUPLICATE_CHECKS: DuplicateCheck[] = [
  'ignore',
  'ask-deck',
  'ask-all',
  'deny-deck',
  'deny-all',
]

const OPPOSITES: Partial<Record<DuplicateCheck, DuplicateCheck>> = {
  'ask-deck': 'deny-deck',
  'deny-deck': 'ask-deck',
  'ask-all': 'deny-all',
  'deny-all': 'ask-all',
}

function isDuplicateCheck(value: unknown): value is DuplicateCheck {
  return DUPLICATE_CHECKS.includes(value as DuplicateCheck)
}

/** Приводит сохранённый набор к допустимому виду и убирает взаимоисключающие пары. */
export function normalizeDuplicateChecks(raw: unknown): DuplicateCheck[] {
  if (!Array.isArray(raw)) return ['ignore']

  const picked = new Set<DuplicateCheck>()
  for (const value of raw) {
    if (!isDuplicateCheck(value)) continue
    if (value === 'ignore') return ['ignore']
    const opposite = OPPOSITES[value]
    if (opposite && picked.has(opposite)) continue
    picked.add(value)
  }

  if (picked.size === 0) return ['ignore']
  return DUPLICATE_CHECKS.filter((value) => picked.has(value))
}

/** Переключает один чекбокс, соблюдая правила взаимоисключения. */
export function toggleDuplicateCheck(
  current: DuplicateCheck[],
  value: DuplicateCheck,
  checked: boolean,
): DuplicateCheck[] {
  if (!checked) return current.filter((item) => item !== value)
  if (value === 'ignore') return ['ignore']

  const next = new Set<DuplicateCheck>(current.filter((item) => item !== 'ignore'))
  const opposite = OPPOSITES[value]
  if (opposite) next.delete(opposite)
  next.add(value)
  return DUPLICATE_CHECKS.filter((item) => next.has(item))
}
