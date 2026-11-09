import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'
import { normalizeData } from '../lib/normalize'
import { Icon } from './Icon'
import { ConfirmDialog } from './Modal'

interface PendingImport {
  raw: unknown
  name: string
}

export function BackupPanel() {
  const { data, resetProgress, replaceData } = useStore()
  const { t } = useI18n()
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const preview = pendingImport ? normalizeData(pendingImport.raw) : null

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
      if (result.error) {
        setError(t('settings.noticeImportReadError'))
        return
      }
      setPendingImport({
        raw: result.data,
        name: result.path?.split(/[\\/]/).pop() ?? t('common.file'),
      })
      return
    }
    fileRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const raw = JSON.parse(await file.text())
      setPendingImport({ raw, name: file.name })
    } catch {
      setError(t('settings.noticeImportBadFile'))
    }
  }

  const openFolder = async () => {
    const folder = await window.kotoba?.openDataFolder()
    if (folder) setNotice(t('settings.noticeFolder', { path: folder }))
  }

  return (
    <>
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

        {notice && (
          <p className="notice">
            <Icon name="check" size={15} />
            <span>{notice}</span>
          </p>
        )}
        {error && <p className="form-error">{error}</p>}

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

      {confirmReset && (
        <ConfirmDialog
          title={t('settings.resetTitle')}
          text={t('settings.resetText')}
          confirmLabel={t('settings.resetConfirm')}
          danger
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            resetProgress()
            setNotice(t('settings.noticeResetDone'))
          }}
        />
      )}

      {pendingImport && preview && (
        <ConfirmDialog
          title={t('settings.importTitle')}
          text={t('settings.importText', {
            name: pendingImport.name,
            cards: preview.cards.length,
            decks: preview.decks.length,
          })}
          confirmLabel={t('settings.importConfirm')}
          danger
          onClose={() => setPendingImport(null)}
          onConfirm={() => {
            replaceData(pendingImport.raw)
            setNotice(t('settings.noticeImported'))
          }}
        />
      )}
    </>
  )
}
