import { useEffect, useMemo, useRef, useState } from 'react'
import type { StorageIssue, StorageLoadResult } from '../lib/storage'
import { inspectBackup } from '../lib/backup'
import {
  getLoadedLocale,
  getLocale,
  loadLocale,
  translateIn,
  type Locale,
  type Translate,
} from '../lib/i18n'
import { Icon } from './Icon'

interface RecoveryScreenProps {
  result: StorageLoadResult
  onRetry: () => void
  onStartFresh: () => void
  onImport: (raw: unknown) => void
}

interface PendingRecovery {
  raw: unknown
  name: string
  decks: number
  cards: number
}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Пытаемся показать экран на языке приложения, а если настройки потеряны — на системном. */
function recoveryLanguage(result: StorageLoadResult): string {
  const settings = result.parts?.settings
  if (isObj(settings) && typeof settings.language === 'string') {
    return settings.language
  }
  const browserLanguage = typeof navigator !== 'undefined' ? navigator.language : ''
  if (browserLanguage.toLowerCase().startsWith('ru')) return 'ru'
  if (browserLanguage.toLowerCase().startsWith('es')) return 'es'
  return 'en'
}

export function RecoveryScreen({
  result,
  onRetry,
  onStartFresh,
  onImport,
}: RecoveryScreenProps) {
  const [locale, setLocale] = useState<Locale>(
    () => getLoadedLocale(recoveryLanguage(result)) ?? getLocale('en'),
  )

  useEffect(() => {
    let cancelled = false
    const code = recoveryLanguage(result)
    const cached = getLoadedLocale(code)
    if (cached) {
      setLocale(cached)
      return
    }
    void loadLocale(code)
      .then((next) => {
        if (!cancelled) setLocale(next)
      })
      .catch(() => {
        void loadLocale('en').then((fallback) => {
          if (!cancelled) setLocale(fallback)
        })
      })
    return () => {
      cancelled = true
    }
  }, [result])

  const t = useMemo<Translate>(
    () => (key, params) => translateIn(locale, key, params),
    [locale],
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingRecovery | null>(null)
  const [confirmFresh, setConfirmFresh] = useState(false)

  const issueLabel = (issue: StorageIssue) =>
    `${t(`recovery.part.${issue.part}`)} — ${t(`recovery.kind.${issue.kind}`)}`

  const openFile = async (file: File | undefined) => {
    setError(null)
    setConfirmFresh(false)
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      const inspection = inspectBackup(raw)
      if (!inspection.ok) {
        setError(t('recovery.importInvalid'))
        return
      }
      setPending({
        raw,
        name: file.name,
        decks: inspection.decks,
        cards: inspection.cards,
      })
    } catch {
      setError(t('recovery.importInvalid'))
    }
  }

  const startFresh = () => {
    if (!confirmFresh) {
      setConfirmFresh(true)
      return
    }
    onStartFresh()
  }

  return (
    <div className="recovery">
      <div className="recovery-card">
        <div className="recovery-icon">
          <Icon name="alert" size={28} />
        </div>
        <div className="eyebrow">言 · Kotoba</div>
        <h1>{t('recovery.title')}</h1>
        <p className="page-sub">{t('recovery.text')}</p>

        <ul className="recovery-files">
          {result.issues.map((issue, index) => (
            <li key={`${issue.part}-${issue.kind}-${index}`}>
              <div className="recovery-file-head">
                <strong>{issueLabel(issue)}</strong>
                {issue.file && <code>{issue.file}</code>}
              </div>
              {issue.corruptFile && (
                <span>{t('recovery.savedAs', { file: issue.corruptFile })}</span>
              )}
              {issue.backupFile && (
                <span>{t('recovery.backupAvailable', { file: issue.backupFile })}</span>
              )}
              {issue.message && <span>{issue.message}</span>}
            </li>
          ))}
        </ul>

        {error && <p className="form-error">{error}</p>}

        {pending ? (
          <div className="recovery-pending">
            <p>
              {t('recovery.importReady', {
                name: pending.name,
                decks: pending.decks,
                cards: pending.cards,
              })}
            </p>
            <div className="recovery-actions">
              <button className="btn btn-primary" onClick={() => onImport(pending.raw)}>
                {t('recovery.importConfirm')}
              </button>
              <button className="btn btn-ghost" onClick={() => setPending(null)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="recovery-actions">
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={16} />
              {t('recovery.import')}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setConfirmFresh(false)
                onRetry()
              }}
            >
              <Icon name="rotate" size={16} />
              {t('recovery.retry')}
            </button>
            {window.kotoba && (
              <button
                className="btn btn-ghost"
                onClick={() => void window.kotoba?.openDataFolder()}
              >
                <Icon name="folder" size={16} />
                {t('recovery.openFolder')}
              </button>
            )}
            <button
              className={`btn ${confirmFresh ? 'btn-danger' : 'btn-danger-ghost'}`}
              onClick={startFresh}
            >
              <Icon name="trash" size={16} />
              {confirmFresh ? t('recovery.startFreshConfirm') : t('recovery.startFresh')}
            </button>
          </div>
        )}

        <p className="hint">{t('recovery.startFreshHint')}</p>
        <p className="hint">{t('recovery.noSaveHint')}</p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            void openFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
