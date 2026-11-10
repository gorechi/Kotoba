import { useEffect, useRef, useState } from 'react'
import type { AppData, AutoBackupFrequency, AutoBackupInfo } from '../types'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import {
  applyBackup,
  inspectBackup,
  type BackupImportMode,
  type BackupInspection,
  type BackupInspectionError,
} from '../lib/backup'
import { Icon } from './Icon'
import { ConfirmDialog, Modal } from './Modal'

interface PendingImport {
  raw: unknown
  name: string
  inspection: BackupInspection
}

const AUTO_BACKUP_OPTIONS: {
  value: AutoBackupFrequency
  labelKey: string
  hintKey: string
}[] = [
  { value: 'never', labelKey: 'autoBackup.never', hintKey: 'autoBackup.neverHint' },
  {
    value: 'on-close',
    labelKey: 'autoBackup.onClose',
    hintKey: 'autoBackup.onCloseHint',
  },
  { value: 'daily', labelKey: 'autoBackup.daily', hintKey: 'autoBackup.dailyHint' },
  {
    value: 'every-2-days',
    labelKey: 'autoBackup.every2',
    hintKey: 'autoBackup.every2Hint',
  },
  {
    value: 'every-3-days',
    labelKey: 'autoBackup.every3',
    hintKey: 'autoBackup.every3Hint',
  },
]

/**
 * Снимок данных до последнего импорта. Живёт в модуле, чтобы кнопку
 * «Отменить импорт» можно было нажать и после перехода на другую страницу.
 */
let lastImportSnapshot: AppData | null = null

export function BackupPanel() {
  const { data, resetProgress, replaceData, setSettings, flush } = useStore()
  const { t, locale } = useI18n()
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [importMode, setImportMode] = useState<BackupImportMode>('replace')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [canUndoImport, setCanUndoImport] = useState(() => Boolean(lastImportSnapshot))
  const [backupInfo, setBackupInfo] = useState<AutoBackupInfo | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const hasApi = Boolean(window.kotoba)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  // Проверяем срок автоматической копии при открытии вкладки и после смены
  // частоты/папки. Основной планировщик в главном процессе делает то же самое.
  useEffect(() => {
    const check = window.kotoba?.checkAutoBackup
    if (!check) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const info = await check(data.settings)
          if (!cancelled) setBackupInfo(info)
        } catch {
          /* статус копий не критичен для работы приложения */
        }
      })()
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [data.settings.autoBackup, data.settings.backupFolder])

  const refreshBackupInfo = async () => {
    if (!window.kotoba?.getAutoBackupInfo) return
    try {
      setBackupInfo(await window.kotoba.getAutoBackupInfo(data.settings))
    } catch {
      /* ignore */
    }
  }

  const chooseBackupFolder = async () => {
    if (!window.kotoba?.chooseBackupFolder) return
    const folder = await window.kotoba.chooseBackupFolder(
      t('autoBackup.chooseFolderTitle'),
    )
    if (!folder) return
    setSettings({ backupFolder: folder })
    setNotice(t('autoBackup.folderSelected', { path: folder }))
  }

  const resetBackupFolder = () => {
    setSettings({ backupFolder: null })
    setNotice(t('autoBackup.folderReset'))
  }

  const openBackupFolder = async () => {
    const opened = await window.kotoba?.openBackupFolder(data.settings)
    if (!opened) setError(t('autoBackup.openError'))
  }

  const backupNow = async () => {
    if (!window.kotoba?.createAutoBackup || backupBusy) return
    setError(null)
    setBackupBusy(true)
    try {
      // Сначала фиксируем последние изменения на диске, чтобы копия была свежей.
      const saved = await flush()
      if (!saved) {
        setError(t('autoBackup.saveFirstError'))
        return
      }
      const result = await window.kotoba.createAutoBackup(data.settings)
      if (result.error) {
        setError(t('autoBackup.error'))
        return
      }
      setNotice(t('autoBackup.created', { path: result.path ?? '' }))
      await refreshBackupInfo()
    } catch {
      setError(t('autoBackup.error'))
    } finally {
      setBackupBusy(false)
    }
  }

  const lastBackupLabel = backupInfo?.lastBackupAt
    ? new Intl.DateTimeFormat(locale.intl, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(backupInfo.lastBackupAt)
    : null

  const inspectionErrorKey = (code: BackupInspectionError | undefined) => {
    if (code === 'unsupported-version') return 'settings.importUnsupportedVersion'
    if (code === 'no-valid-decks') return 'settings.importNoDecks'
    return 'settings.importInvalid'
  }

  const openBackup = (raw: unknown, name: string) => {
    const inspection = inspectBackup(raw)
    if (!inspection.ok) {
      setError(t(inspectionErrorKey(inspection.error)))
      return
    }
    setError(null)
    setNotice(null)
    setImportMode('replace')
    setPendingImport({ raw, name, inspection })
  }

  const handleExport = async () => {
    setError(null)
    if (window.kotoba) {
      const path = await window.kotoba.exportData(data, t('settings.exportDialogTitle'))
      if (path) setNotice(t('settings.noticeBackupSaved', { path }))
      return
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'kotoba-backup.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice(t('settings.noticeBackupDownloaded'))
  }

  const handleImport = async () => {
    setError(null)
    if (window.kotoba) {
      const result = await window.kotoba.importData(t('settings.importDialogTitle'))
      if (!result) return
      if (result.error || result.data === undefined) {
        setError(t('settings.noticeImportReadError'))
        return
      }
      openBackup(
        result.data,
        result.path?.split(/[\\/]/).pop() ?? t('common.file'),
      )
      return
    }
    fileRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    setError(null)
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      openBackup(raw, file.name)
    } catch {
      setError(t('settings.noticeImportBadFile'))
    }
  }

  const confirmImport = async () => {
    if (!pendingImport || busy) return
    setError(null)
    setBusy(true)

    // В Electron сохраняем настоящий файл рядом с данными. Если это не удалось,
    // импорт отменяется: лучше не рисковать текущими колодами и прогрессом.
    let backupPath: string | null = null
    if (window.kotoba?.backupBeforeImport) {
      try {
        backupPath = await window.kotoba.backupBeforeImport(data)
      } catch {
        setBusy(false)
        setError(t('settings.importBackupFailed'))
        return
      }
    }

    lastImportSnapshot = data
    setCanUndoImport(true)
    replaceData(applyBackup(data, pendingImport.raw, importMode))
    setPendingImport(null)
    setNotice(
      backupPath
        ? t('settings.noticeImportedWithBackup', { path: backupPath })
        : t('settings.noticeImported'),
    )
    setBusy(false)
  }

  const undoImport = () => {
    if (!lastImportSnapshot) return
    replaceData(lastImportSnapshot)
    lastImportSnapshot = null
    setCanUndoImport(false)
    setNotice(t('settings.noticeImportUndone'))
  }

  const openFolder = async () => {
    const folder = await window.kotoba?.openDataFolder()
    if (folder) setNotice(t('settings.noticeFolder', { path: folder }))
  }

  const skipped =
    pendingImport &&
    (pendingImport.inspection.skippedDecks > 0 || pendingImport.inspection.skippedCards > 0)

  return (
    <>
      {(notice || error) && (
        <div className="backup-notices">
          {notice && (
            <p className="notice">
              <Icon name="check" size={15} />
              <span>{notice}</span>
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}

      <section className="panel auto-backup-panel">
        <div className="panel-head">
          <div>
            <h2>{t('autoBackup.title')}</h2>
            <p>{t('autoBackup.subtitle')}</p>
          </div>
          {backupInfo && (
            <span className="badge badge-soft">
              {t('autoBackup.count', { n: backupInfo.count })}
            </span>
          )}
        </div>

        <div className="backup-folder-row">
          <div className="backup-folder-copy">
            <span className="backup-field-label">{t('autoBackup.folder')}</span>
            <code className="backup-folder-path">
              {backupInfo?.folder ??
                (hasApi
                  ? t('autoBackup.folderLoading')
                  : t('autoBackup.folderUnavailable'))}
            </code>
            {backupInfo && (
              <span className="backup-folder-note">
                {backupInfo.isCustom
                  ? t('autoBackup.folderCustom')
                  : t('autoBackup.folderDefault')}
              </span>
            )}
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => void chooseBackupFolder()}
              disabled={!hasApi}
            >
              <Icon name="folder" size={15} />
              {t('autoBackup.chooseFolder')}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => void openBackupFolder()}
              disabled={!hasApi || !backupInfo}
            >
              <Icon name="arrow-right" size={15} />
              {t('autoBackup.openFolder')}
            </button>
            {backupInfo?.isCustom && (
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={resetBackupFolder}
              >
                <Icon name="rotate" size={15} />
                {t('autoBackup.resetFolder')}
              </button>
            )}
          </div>
        </div>

        <fieldset className="backup-frequency">
          <legend className="backup-field-label">{t('autoBackup.frequency')}</legend>
          <div className="backup-frequency-list">
            {AUTO_BACKUP_OPTIONS.map((option) => {
              const checked = data.settings.autoBackup === option.value
              return (
                <label
                  key={option.value}
                  className={`radio-option${checked ? ' is-checked' : ''}`}
                >
                  <input
                    type="radio"
                    name="auto-backup-frequency"
                    value={option.value}
                    checked={checked}
                    onChange={() => setSettings({ autoBackup: option.value })}
                  />
                  <span className="radio-dot" aria-hidden="true" />
                  <span className="radio-copy">
                    <strong>{t(option.labelKey)}</strong>
                    <span>{t(option.hintKey)}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="backup-meta">
          {backupInfo &&
            (lastBackupLabel ? (
              <span>{t('autoBackup.lastBackup', { date: lastBackupLabel })}</span>
            ) : (
              <span>{t('autoBackup.noBackups')}</span>
            ))}
        </div>

        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void backupNow()}
            disabled={!hasApi || backupBusy}
          >
            <Icon name="download" size={16} />
            {backupBusy ? t('autoBackup.creating') : t('autoBackup.backupNow')}
          </button>
        </div>

        <p className="hint">
          {t('autoBackup.retentionHint', { n: backupInfo?.retention ?? 7 })}
        </p>
        {!hasApi && <p className="hint">{t('autoBackup.webHint')}</p>}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t('data.backupTitle')}</h2>
            <p>{t('data.backupSub')}</p>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={() => void handleExport()}>
            <Icon name="download" size={17} />
            {t('settings.export')}
          </button>
          <button className="btn btn-ghost" onClick={() => void handleImport()}>
            <Icon name="upload" size={17} />
            {t('settings.import')}
          </button>
          {window.kotoba && (
            <button className="btn btn-ghost" onClick={() => void openFolder()}>
              <Icon name="folder" size={17} />
              {t('settings.dataFolder')}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>

        {canUndoImport && (
          <div className="import-undo">
            <button className="btn btn-ghost btn-small" onClick={undoImport}>
              <Icon name="rotate" size={15} />
              {t('settings.undoImport')}
            </button>
          </div>
        )}

        <p className="hint">{t('settings.dataHint')}</p>
      </section>

      <section className="panel danger-panel">
        <div className="panel-head">
          <div>
            <h2>{t('settings.reset')}</h2>
            <p>{t('settings.resetSub')}</p>
          </div>
          <button className="btn btn-danger-ghost" onClick={() => setConfirmReset(true)}>
            <Icon name="rotate" size={17} />
            {t('settings.resetProgress')}
          </button>
        </div>
        <p className="hint">{t('settings.resetHint')}</p>
      </section>

      {pendingImport && (
        <Modal
          title={t('settings.importTitle')}
          onClose={() => {
            if (!busy) setPendingImport(null)
          }}
          footer={
            <>
              <button
                className="btn btn-ghost"
                onClick={() => setPendingImport(null)}
                disabled={busy}
              >
                {t('confirm.cancel')}
              </button>
              <button
                className={`btn ${importMode === 'replace' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => void confirmImport()}
                disabled={
                  busy ||
                  (importMode === 'merge' && pendingImport.inspection.customDecks === 0)
                }
              >
                {busy ? t('settings.importBusy') : t('settings.importConfirm')}
              </button>
            </>
          }
        >
          <p className="modal-text">
            {t('settings.importFile', { name: pendingImport.name })}
          </p>

          <div className="import-summary">
            <div>
              <strong>{pendingImport.inspection.decks}</strong>
              <span>
                {t('settings.importDecks', { n: pendingImport.inspection.decks })}
              </span>
            </div>
            <div>
              <strong>{pendingImport.inspection.cards}</strong>
              <span>
                {t('settings.importCards', { n: pendingImport.inspection.cards })}
              </span>
            </div>
          </div>

          {skipped && (
            <p className="form-error">
              {t('settings.importSkipped', {
                decks: pendingImport.inspection.skippedDecks,
                cards: pendingImport.inspection.skippedCards,
              })}
            </p>
          )}

          <div className="import-mode">
            <span className="import-mode-label">{t('settings.importMode')}</span>
            <div className="segmented">
              <button
                type="button"
                className={importMode === 'replace' ? 'active' : ''}
                onClick={() => setImportMode('replace')}
              >
                {t('settings.importModeReplace')}
              </button>
              <button
                type="button"
                className={importMode === 'merge' ? 'active' : ''}
                onClick={() => setImportMode('merge')}
              >
                {t('settings.importModeMerge')}
              </button>
            </div>
            <p className="hint">
              {importMode === 'replace'
                ? t('settings.importModeReplaceHint')
                : t('settings.importModeMergeHint')}
            </p>
            {importMode === 'merge' && pendingImport.inspection.customDecks === 0 && (
              <p className="form-error">{t('settings.importNoCustomDecks')}</p>
            )}
            {importMode === 'merge' && pendingImport.inspection.customDecks > 0 && (
              <p className="hint">{t('settings.importModeMergeNote')}</p>
            )}
          </div>

          <p className="hint">
            {window.kotoba
              ? t('settings.importSafetyHint')
              : t('settings.importSafetyHintWeb')}
          </p>
        </Modal>
      )}

      {confirmReset && (
        <ConfirmDialog
          title={t('settings.resetTitle')}
          text={t('settings.resetText')}
          confirmLabel={t('settings.resetConfirm')}
          danger
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            resetProgress()
            lastImportSnapshot = null
            setCanUndoImport(false)
            setNotice(t('settings.noticeResetDone'))
          }}
        />
      )}
    </>
  )
}
