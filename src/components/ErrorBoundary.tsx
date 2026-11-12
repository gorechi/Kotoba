import { Component, type ErrorInfo, type ReactNode } from 'react'
import { translate } from '../lib/i18n'
import { Icon } from './Icon'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Последняя линия защиты: ошибка рендера не должна оставлять белый экран. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[kotoba] render error', error, info.componentStack)
  }

  private reload = () => {
    window.location.reload()
  }

  private openDataFolder = () => {
    void window.kotoba?.openDataFolder()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="recovery error-boundary">
        <div className="recovery-card">
          <div className="recovery-icon">
            <Icon name="alert" size={28} />
          </div>
          <div className="eyebrow">言 · Kotoba</div>
          <h1>{translate('errorBoundary.title')}</h1>
          <p className="page-sub">{translate('errorBoundary.text')}</p>

          <div className="recovery-actions">
            <button type="button" className="btn btn-primary" onClick={this.reload}>
              <Icon name="rotate" size={16} />
              {translate('errorBoundary.reload')}
            </button>
            {window.kotoba?.openDataFolder && (
              <button type="button" className="btn btn-ghost" onClick={this.openDataFolder}>
                <Icon name="folder" size={16} />
                {translate('errorBoundary.openFolder')}
              </button>
            )}
          </div>

          <details className="error-boundary-details">
            <summary>{translate('errorBoundary.details')}</summary>
            <pre>
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
