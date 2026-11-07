import { Icon } from './Icon'
import { useStore } from '../state/store'

export function TitleBar() {
  const { flush } = useStore()
  const hasApi = Boolean(window.kotoba)

  const close = async () => {
    await flush()
    await window.kotoba?.close()
  }

  return (
    <header className="titlebar">
      <div className="brand">
        <span className="brand-mark">言</span>
        <span className="brand-name">Котоба</span>
        <span className="brand-tag">японский по карточкам</span>
      </div>
      <div className="titlebar-fill" />
      {hasApi && (
        <div className="window-controls">
          <button
            className="win-btn"
            onClick={() => void window.kotoba?.minimize()}
            aria-label="Свернуть"
            title="Свернуть"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 5h6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            className="win-btn"
            onClick={() => void window.kotoba?.toggleMaximize()}
            aria-label="Развернуть"
            title="Развернуть"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button className="win-btn win-close" onClick={() => void close()} aria-label="Закрыть" title="Закрыть">
            <Icon name="x" size={13} />
          </button>
        </div>
      )}
    </header>
  )
}
