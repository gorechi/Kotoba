import type { DuplicateAction, DuplicatePolicy } from '../types'

export const DEFAULT_DUPLICATE_POLICY: DuplicatePolicy = {
  ignoreAll: false,
  withinDeck: 'ask',
  acrossDecks: 'ignore',
}

const ACTIONS: DuplicateAction[] = ['ignore', 'ask', 'deny']

function action(value: unknown, fallback: DuplicateAction): DuplicateAction {
  return ACTIONS.includes(value as DuplicateAction) ? (value as DuplicateAction) : fallback
}

function legacyPolicy(raw: unknown): DuplicatePolicy | null {
  if (!Array.isArray(raw)) return null
  const values = new Set(raw)
  if (values.has('ignore')) return { ...DEFAULT_DUPLICATE_POLICY, ignoreAll: true }
  return {
    ignoreAll: false,
    withinDeck: values.has('deny-deck')
      ? 'deny'
      : values.has('ask-deck')
        ? 'ask'
        : DEFAULT_DUPLICATE_POLICY.withinDeck,
    acrossDecks: values.has('deny-all')
      ? 'deny'
      : values.has('ask-all')
        ? 'ask'
        : DEFAULT_DUPLICATE_POLICY.acrossDecks,
  }
}

/** Приводит сохранённые настройки к актуальному виду. */
export function normalizeDuplicatePolicy(raw: unknown, legacy?: unknown): DuplicatePolicy {
  const migrated = legacyPolicy(legacy)
  if (migrated) return migrated
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_DUPLICATE_POLICY }
  }

  const value = raw as Record<string, unknown>
  return {
    ignoreAll: value.ignoreAll === true,
    withinDeck: action(value.withinDeck, DEFAULT_DUPLICATE_POLICY.withinDeck),
    acrossDecks: action(value.acrossDecks, DEFAULT_DUPLICATE_POLICY.acrossDecks),
  }
}
