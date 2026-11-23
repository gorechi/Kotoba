import type { DuplicateAction } from '../types'

export const DEFAULT_DUPLICATE_ACTION: DuplicateAction = 'ask'

const ACTIONS: DuplicateAction[] = ['ignore', 'ask', 'deny']

function isAction(value: unknown): value is DuplicateAction {
  return ACTIONS.includes(value as DuplicateAction)
}

/** Приводит сохранённую настройку к актуальному виду. */
export function normalizeDuplicateAction(
  raw: unknown,
  legacyPolicy?: unknown,
  legacyChecks?: unknown,
): DuplicateAction {
  if (isAction(raw)) return raw

  if (legacyPolicy && typeof legacyPolicy === 'object' && !Array.isArray(legacyPolicy)) {
    const policy = legacyPolicy as Record<string, unknown>
    if (policy.ignoreAll === true) return 'ignore'
    if (isAction(policy.withinDeck)) return policy.withinDeck
    if (isAction(policy.acrossDecks)) return policy.acrossDecks
  }

  if (Array.isArray(legacyChecks)) {
    const values = new Set(legacyChecks)
    if (values.has('deny-deck') || values.has('deny-all')) return 'deny'
    if (values.has('ask-deck') || values.has('ask-all')) return 'ask'
    if (values.has('ignore')) return 'ignore'
  }

  return DEFAULT_DUPLICATE_ACTION
}
