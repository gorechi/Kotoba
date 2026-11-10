import { useState } from 'react'
import { Icon } from './Icon'
import { useStore } from '../state/store'
import { useI18n } from '../lib/i18n-react'

export function TitleBar() {
  const { flush, saveState, retrySave } = useStore()
  const { t } = useI18n()
  const hasApi = Boolean(window.kotoba)
  const [closing, setClosing] = useState(false)

  const close = async () => {
    if (closing) return
    setClosing(true)
    const saved = await flush()
    setClosing(false)
    if (saved) await window.kotoba?.close()
  }

  return (
    <header className="titlebar">
      <div className="brand">
        <span className="brand-mark">言</span>
        <span className="brand-name">{t('brand.name')}</span>
        <span className="brand-tag">{t('brand.tag')}</span>
      </div>
      <div className="titlebar-fill" />
      {saveState.status !== 'idle' && (
        <div
          className={`save-status save-status--${saveState.status}`}
          title={saveState.error}
        >
          {saveState.status === 'saving' ? (
            <span className="save-spinner" aria-hidden="true" />
          ) : (
            <Icon name={saveState.status === 'saved' ? 'check' : 'alert'} size={13} />
          )}
          <span className="save-status-text" role="status" aria-live="polite">
            {t(`save.${saveState.status}`)}
          </span>
          {saveState.status === 'error' && (
            <button type="button" className="save-retry" onClick={retrySave}>
              {t('save.retry')}
            </button>
          )}
        </div>
      )}
      {hasApi && (
        <div className="window-controls">
          <button
            className="win-btn"
            onClick={() => void window.kotoba?.minimize()}
            aria-label={t('titlebar.minimize')}
            title={t('titlebar.minimize')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 5h6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            className="win-btn"
            onClick={() => void window.kotoba?.toggleMaximize()}
            aria-label={t('titlebar.maximize')}
            title={t('titlebar.maximize')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            className="win-btn win-close"
            onClick={() => void close()}
            disabled={closing}
            aria-label={t('titlebar.close')}
            title={t('titlebar.close')}
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      )}
    </header>
  )
}
