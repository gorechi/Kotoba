import { useEffect, useRef, useState } from 'react'
import type { Theme } from '../types'
import { useStore } from '../state/store'
import { normalizeData } from '../lib/normalize'
import { Icon, type IconName } from '../components/Icon'
import { ConfirmDialog } from '../components/Modal'

const THEMES: { value: Theme; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Светлая', icon: 'sun' },
  { value: 'dark', label: 'Тёмная', icon: 'moon' },
  { value: 'system', label: 'Системная', icon: 'monitor' },
]

interface PendingImport {
  raw: unknown
  name: string
}

export function Settings() {
  const { data, setSettings, resetProgress, replaceData } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 7000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const preview = pendingImport ? normalizeData(pendingImport.raw) : null

  const changeNewPerDay = (delta: number) => {
    setSettings({ newPerDay: Math.min(50, Math.max(1, data.settings.newPerDay + delta)) })
  }

  const handleExport = async () => {
    setError(null)
    if (window.kotoba) {
      const path = await window.kotoba.exportData(data)
      if (path) setNotice(`Резервная копия сохранена: ${path}`)
      return
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'kotoba-backup.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('Резервная копия скачана.')
  }

  const handleImport = async () => {
    setError(null)
    if (window.kotoba) {
      const result = await window.kotoba.importData()
      if (!result) return
      if (result.error) {
        setError('Не удалось прочитать файл. Убедись, что это JSON-бэкап Котоба.')
        return
      }
      setPendingImport({
        raw: result.data,
        name: result.path?.split(/[\\/]/).pop() ?? 'файл',
      })
      return
    }
    fileRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const raw = JSON.parse(await file.text())
      setPendingImport({ raw, name: file.name })
    } catch {
      setError('Файл не похож на резервную копию Котоба.')
    }
  }

  const openFolder = async () => {
    const folder = await window.kotoba?.openDataFolder()
    if (folder) setNotice(`Папка с данными: ${folder}`)
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <div className="eyebrow">Настройки</div>
          <h1>Всё под себя</h1>
          <p className="page-sub">Внешний вид, темп обучения и резервные копии.</p>
        </div>
      </header>

      <div className="settings-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Внешний вид</h2>
              <p>Тема интерфейса</p>
            </div>
          </div>
          <div className="segmented">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                className={data.settings.theme === theme.value ? 'active' : ''}
                onClick={() => setSettings({ theme: theme.value })}
              >
                <Icon name={theme.icon} size={16} />
                {theme.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Темп обучения</h2>
              <p>Сколько новых карточек давать в день</p>
            </div>
          </div>

          <div className="goal-row">
            <div className="goal-value">
              <strong>{data.settings.newPerDay}</strong>
              <span>новых в день</span>
            </div>
            <div className="stepper">
              <button onClick={() => changeNewPerDay(-1)} aria-label="Меньше">
                <Icon name="minus" size={16} />
              </button>
              <button onClick={() => changeNewPerDay(1)} aria-label="Больше">
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>

          <input
            className="range"
            type="range"
            min={1}
            max={50}
            value={data.settings.newPerDay}
            onChange={(event) => setSettings({ newPerDay: Number(event.target.value) })}
            aria-label="Новых карточек в день"
          />
          <div className="range-scale">
            <span>1</span>
            <span>50</span>
          </div>
          <p className="hint">
            Для азбук хватает 5–10 в день. Если чувствуешь, что легко — добавь ещё.
          </p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Данные</h2>
            <p>Резервные копии и папка с файлами</p>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={() => void handleExport()}>
            <Icon name="download" size={17} />
            Экспорт
          </button>
          <button className="btn btn-ghost" onClick={() => void handleImport()}>
            <Icon name="upload" size={17} />
            Импорт
          </button>
          {window.kotoba && (
            <button className="btn btn-ghost" onClick={() => void openFolder()}>
              <Icon name="folder" size={17} />
              Папка с данными
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

        <p className="hint">
          Прогресс сохраняется автоматически в JSON-файл на этом компьютере. Экспорт пригодится для
          бэкапа или переноса обучения на другой ПК.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Горячие клавиши</h2>
            <p>Во время учёбы</p>
          </div>
        </div>
        <div className="shortcuts">
          <div>
            <kbd>пробел</kbd>
            <span>перевернуть карточку</span>
          </div>
          <div>
            <kbd>1</kbd>
            <span>снова — карточка вернётся</span>
          </div>
          <div>
            <kbd>2</kbd>
            <span>трудно</span>
          </div>
          <div>
            <kbd>3</kbd>
            <span>хорошо</span>
          </div>
          <div>
            <kbd>4</kbd>
            <span>легко</span>
          </div>
          <div>
            <kbd>esc</kbd>
            <span>выйти из подхода</span>
          </div>
        </div>
      </section>

      <section className="panel danger-panel">
        <div className="panel-head">
          <div>
            <h2>Сброс</h2>
            <p>Начать обучение с чистого листа</p>
          </div>
          <button className="btn btn-danger-ghost" onClick={() => setConfirmReset(true)}>
            <Icon name="rotate" size={17} />
            Сбросить прогресс
          </button>
        </div>
        <p className="hint">
          Все карточки снова станут новыми, история и серия обнулятся. Колоды и сами карточки
          останутся на месте.
        </p>
      </section>

      <footer className="about">
        <span className="brand-mark small">言</span>
        <div>
          <strong>Котоба · 言葉</strong>
          <span>версия 0.1.0 · сделано для спокойной учёбы</span>
        </div>
      </footer>

      {confirmReset && (
        <ConfirmDialog
          title="Сбросить весь прогресс?"
          text="Весь прогресс повторений и история будут обнулены. Колоды и карточки останутся. Это действие нельзя отменить."
          confirmLabel="Сбросить всё"
          danger
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            resetProgress()
            setNotice('Прогресс сброшен. Можно начинать заново.')
          }}
        />
      )}

      {pendingImport && preview && (
        <ConfirmDialog
          title="Импортировать данные?"
          text={`Файл «${pendingImport.name}»: ${preview.cards.length} карточек и ${preview.decks.length} колод. Текущие колоды и прогресс будут заменены.`}
          confirmLabel="Импортировать"
          danger
          onClose={() => setPendingImport(null)}
          onConfirm={() => {
            replaceData(pendingImport.raw)
            setNotice('Данные импортированы.')
          }}
        />
      )}
    </div>
  )
}
