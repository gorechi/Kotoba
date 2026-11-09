import { useState } from 'react'
import { useI18n } from '../lib/i18n-react'
import { BackupPanel } from '../components/BackupPanel'
import { CsvImport } from '../components/CsvImport'

type DataTab = 'kana' | 'kanji' | 'backup'

export function Data() {
  const { t } = useI18n()
  const [tab, setTab] = useState<DataTab>('kana')

  return (
    <div className="page data-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('data.eyebrow')}</div>
          <h1>{t('data.title')}</h1>
          <p className="page-sub">{t('data.subtitle')}</p>
        </div>
      </header>

      <div className="segmented data-tabs">
        <button
          type="button"
          className={tab === 'kana' ? 'active' : ''}
          onClick={() => setTab('kana')}
        >
          {t('data.tabKana')}
        </button>
        <button
          type="button"
          className={tab === 'kanji' ? 'active' : ''}
          onClick={() => setTab('kanji')}
        >
          {t('data.tabKanji')}
        </button>
        <button
          type="button"
          className={tab === 'backup' ? 'active' : ''}
          onClick={() => setTab('backup')}
        >
          {t('data.tabBackup')}
        </button>
      </div>

      <div className="data-content">
        {tab === 'kana' && <CsvImport key="kana" kind="kana" />}
        {tab === 'kanji' && <CsvImport key="kanji" kind="kanji" />}
        {tab === 'backup' && (
          <div className="data-stack">
            <BackupPanel />
          </div>
        )}
      </div>
    </div>
  )
}
