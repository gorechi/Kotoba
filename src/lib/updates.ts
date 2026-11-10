import type { UpdateCheckResult } from '../types'
import { APP_VERSION } from './version'

const RELEASES_API = 'https://api.github.com/repos/gorechi/Kotoba/releases/latest'
const RELEASES_PAGE = 'https://github.com/gorechi/Kotoba/releases/latest'

export type UpdateStatus = 'idle' | 'checking' | 'current' | 'available' | 'error'

export interface UpdateState {
  status: UpdateStatus
  currentVersion: string
  latestVersion?: string
  releaseUrl?: string
  releaseName?: string
  error?: string
}

function normalizeVersion(value: string | undefined): string {
  return (value ?? '').trim().replace(/^v/i, '')
}

function versionParts(value: string): number[] {
  return normalizeVersion(value)
    .split(/[.+-]/)
    .slice(0, 3)
    .map((part) => {
      const number = Number.parseInt(part.replace(/\D/g, ''), 10)
      return Number.isFinite(number) ? number : 0
    })
}

function isNewer(latest: string, current: string): boolean {
  const next = versionParts(latest)
  const now = versionParts(current)
  for (let index = 0; index < 3; index += 1) {
    const left = next[index] ?? 0
    const right = now[index] ?? 0
    if (left > right) return true
    if (left < right) return false
  }
  return false
}

async function requestRelease(): Promise<UpdateCheckResult> {
  if (window.kotoba?.checkUpdates) {
    return window.kotoba.checkUpdates()
  }

  // Веб-версия: GitHub API отдаёт CORS-заголовки, поэтому проверка работает
  // и в браузере. В установленном приложении используется IPC.
  const response = await fetch(RELEASES_API, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) throw new Error(`GitHub API ${response.status}`)
  const release = (await response.json()) as {
    tag_name?: string
    name?: string
    html_url?: string
    published_at?: string
  }
  return {
    currentVersion: APP_VERSION,
    latestVersion: release.tag_name,
    releaseName: release.name,
    releaseUrl: release.html_url,
    publishedAt: release.published_at,
  }
}

/**
 * Проверяет последний релиз на GitHub. Ничего не скачивает и не устанавливает.
 * Результат кешируется на сутки; ручная проверка может обойти кеш.
 */
const UPDATE_CACHE_KEY = 'kotoba.updateCheck.v1'
const UPDATE_CACHE_TTL = 24 * 60 * 60 * 1000

interface UpdateCacheEntry {
  checkedAt: number
  state: UpdateState
}

function readUpdateCache(): UpdateCacheEntry | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(UPDATE_CACHE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<UpdateCacheEntry>
    if (
      typeof value.checkedAt !== 'number' ||
      typeof value.state !== 'object' ||
      value.state === null ||
      typeof value.state.status !== 'string' ||
      typeof value.state.currentVersion !== 'string'
    ) {
      return null
    }
    return value as UpdateCacheEntry
  } catch {
    return null
  }
}

function writeUpdateCache(state: UpdateState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      UPDATE_CACHE_KEY,
      JSON.stringify({ checkedAt: Date.now(), state } satisfies UpdateCacheEntry),
    )
  } catch {
    /* Кеш не критичен: просто проверим в следующий раз. */
  }
}

export async function checkForUpdates(options: { force?: boolean } = {}): Promise<UpdateState> {
  if (!options.force) {
    const cached = readUpdateCache()
    if (
      cached &&
      cached.state.currentVersion === APP_VERSION &&
      Date.now() - cached.checkedAt < UPDATE_CACHE_TTL
    ) {
      return cached.state
    }
  }

  try {
    const result = await requestRelease()
    if (result.error) throw new Error(result.error)
    const currentVersion = normalizeVersion(result.currentVersion) || APP_VERSION
    const latestVersion = normalizeVersion(result.latestVersion)

    if (!latestVersion) throw new Error('Release has no version')

    if (isNewer(latestVersion, currentVersion)) {
      const state: UpdateState = {
        status: 'available',
        currentVersion,
        latestVersion,
        releaseUrl: result.releaseUrl || RELEASES_PAGE,
        releaseName: result.releaseName,
      }
      writeUpdateCache(state)
      return state
    }

    const state: UpdateState = {
      status: 'current',
      currentVersion,
      latestVersion,
    }
    writeUpdateCache(state)
    return state
  } catch (error) {
    const state: UpdateState = {
      status: 'error',
      currentVersion: APP_VERSION,
      error: error instanceof Error ? error.message : String(error),
    }
    writeUpdateCache(state)
    return state
  }
}
