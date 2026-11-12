import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { QueueItem, Route, StudyMode } from './types'
import { StoreProvider, useStore } from './state/store'
import { I18nProvider, useI18n } from './lib/i18n-react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Session } from './components/Session'
import { Icon } from './components/Icon'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Onboarding } from './components/Onboarding'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutsDialog } from './components/ShortcutsDialog'
import { Home } from './pages/Home'

const Decks = lazy(() => import('./pages/Decks').then((module) => ({ default: module.Decks })))
const DeckDetail = lazy(() =>
  import('./pages/Decks').then((module) => ({ default: module.DeckDetail })),
)
const KanjiDecks = lazy(() =>
  import('./pages/KanjiDecks').then((module) => ({ default: module.KanjiDecks })),
)
const CardBrowser = lazy(() =>
  import('./pages/CardBrowser').then((module) => ({ default: module.CardBrowser })),
)
const Stats = lazy(() => import('./pages/Stats').then((module) => ({ default: module.Stats })))
const Data = lazy(() => import('./pages/Data').then((module) => ({ default: module.Data })))
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.Settings })),
)
const KanaMap = lazy(() =>
  import('./pages/KanaMap').then((module) => ({ default: module.KanaMap })),
)
const Help = lazy(() => import('./pages/Help').then((module) => ({ default: module.Help })))
const HelpGuidePage = lazy(() =>
  import('./pages/HelpGuidePage').then((module) => ({ default: module.HelpGuidePage })),
)
const TtsHelp = lazy(() =>
  import('./pages/TtsHelp').then((module) => ({ default: module.TtsHelp })),
)
const ProblemCards = lazy(() =>
  import('./pages/ProblemCards').then((module) => ({ default: module.ProblemCards })),
)
import { ZenMode } from './components/ZenMode'
import { effectiveStudyMode, sessionSizeForDeck } from './lib/deck-settings'
import { practiceQueue, buildStudyQueue, limitStudySession } from './lib/study'
import {
  buildCustomStudyQueue,
  type CustomStudyOptions,
} from './lib/custom-study'
import {
  TTS_ERROR_EVENT,
  warmUpTts,
  type TtsErrorDetail,
  type TtsFailureReason,
} from './lib/tts'
import { checkForUpdates, type UpdateState } from './lib/updates'
import { APP_VERSION } from './lib/version'

const TTS_NOTICE_KEY: Record<TtsFailureReason, string> = {
  unsupported: 'tts.unsupported',
  'missing-voice': 'tts.missingVoice',
  error: 'tts.error',
}

function PageLoader() {
  const { t } = useI18n()
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-dot" aria-hidden="true" />
      {t('common.loading')}
    </div>
  )
}

interface TtsNotice {
  reason: TtsFailureReason
  message: string
}

interface ActiveSession {
  deckId: string
  items: QueueItem[]
  mode: StudyMode
  title?: string
  custom?: CustomStudyOptions
}

function Shell() {
  const { data, loadIssues, clearLoadIssues, saveState, retrySave, flush, setSettings } =
    useStore()
  const { t } = useI18n()
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [zen, setZen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [ttsNotice, setTtsNotice] = useState<TtsNotice | null>(null)
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: 'idle',
    currentVersion: APP_VERSION,
  })
  const [updateChecking, setUpdateChecking] = useState(false)
  const updateCheckedRef = useRef(false)
  const mainRef = useRef<HTMLElement>(null)
  const customChunkRef = useRef<{
    pool: QueueItem[]
    size: number
    offset: number
  } | null>(null)

  const checkUpdates = useCallback(async (force = false) => {
    setUpdateChecking(true)
    setUpdateState((previous) => ({ ...previous, status: 'checking' }))
    const result = await checkForUpdates({ force })
    setUpdateState(result)
    setUpdateChecking(false)
  }, [])

  useEffect(() => {
    if (updateCheckedRef.current) return
    updateCheckedRef.current = true
    void checkUpdates()
  }, [checkUpdates])

  useEffect(() => {
    warmUpTts()
  }, [])

  useEffect(() => {
    const onTtsError = (event: Event) => {
      const detail = (event as CustomEvent<TtsErrorDetail>).detail
      if (!detail?.reason) return
      setTtsNotice({
        reason: detail.reason,
        message: t(TTS_NOTICE_KEY[detail.reason] ?? 'tts.error'),
      })
    }
    window.addEventListener(TTS_ERROR_EVENT, onTtsError)
    return () => window.removeEventListener(TTS_ERROR_EVENT, onTtsError)
  }, [t])

  useEffect(() => {
    // Инструкцию по установке голоса пользователь должен успеть прочитать,
    // поэтому это уведомление не скрывается само.
    if (!ttsNotice || ttsNotice.reason === 'missing-voice') return
    const timer = window.setTimeout(() => setTtsNotice(null), 10_000)
    return () => window.clearTimeout(timer)
  }, [ttsNotice])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [route])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (!session) {
          setShortcutsOpen(false)
          setPaletteOpen(true)
        }
        return
      }

      if (typing || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === '?') {
        event.preventDefault()
        setPaletteOpen(false)
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [session])

  useEffect(() => {
    if (!data.settings.zenAuto || zen) return

    const delay = Math.max(1, data.settings.zenIdleMinutes) * 60_000
    let timer: number | undefined
    let lastActivity = 0

    const schedule = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (document.visibilityState === 'visible') setZen(true)
      }, delay)
    }

    const onActivity = () => {
      const now = Date.now()
      if (now - lastActivity < 1000) return
      lastActivity = now
      schedule()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') schedule()
    }

    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'pointermove',
      'keydown',
      'wheel',
      'touchstart',
    ]
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    schedule()

    return () => {
      if (timer) window.clearTimeout(timer)
      events.forEach((name) => window.removeEventListener(name, onActivity))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [data.settings.zenAuto, data.settings.zenIdleMinutes, zen])

  const navigate = (next: Route) => {
    setPaletteOpen(false)
    setShortcutsOpen(false)
    setSession(null)
    setRoute(next)
  }

  const closeSession = useCallback(async () => {
    // Перед выходом из подхода фиксируем отложенную пачку прогресса.
    await flush()
    setSession(null)
  }, [flush])

  const openTtsHelp = () => {
    setTtsNotice(null)
    navigate({ name: 'ttsHelp' })
  }

  const startStudy = (deckId: string) => {
    const now = Date.now()
    const deck = deckId === 'all' ? undefined : data.decks.find((item) => item.id === deckId)
    let items = buildStudyQueue(
      data.cards,
      data.decks,
      deckId,
      data.history,
      data.settings,
      now,
    )
    if (!items.length) items = practiceQueue(data.cards, deckId, now)
    items = limitStudySession(items, sessionSizeForDeck(deck, data.settings))
    if (!items.length) return
    customChunkRef.current = null
    setSession({
      deckId,
      items,
      mode: effectiveStudyMode(deck, data.settings.studyMode),
    })
  }

  const startCustomStudy = (options: CustomStudyOptions, title: string): boolean => {
    const pool = buildCustomStudyQueue(data.cards, data.decks, options, Date.now())
    if (!pool.length) return false
    const size = options.sessionSize ?? 0
    const chunked = size > 0 && pool.length > size
    const items = chunked ? pool.slice(0, size) : pool
    customChunkRef.current = chunked ? { pool, size, offset: size } : null
    const deck =
      options.deckId === 'all'
        ? undefined
        : data.decks.find((item) => item.id === options.deckId)
    setSession({
      deckId: options.deckId,
      items,
      mode: effectiveStudyMode(deck, data.settings.studyMode),
      title,
      custom: options,
    })
    return true
  }

  const partsLabel = (kinds: string[]) => {
    const seen = new Set<string>()
    return loadIssues
      .filter((issue) => kinds.includes(issue.kind))
      .map((issue) => t(`recovery.part.${issue.part}`))
      .filter((label) => {
        if (seen.has(label)) return false
        seen.add(label)
        return true
      })
      .join(', ')
  }

  const recoveredParts = partsLabel(['recovered'])
  const corruptParts = partsLabel(['corrupt', 'load-error'])
  const missingParts = partsLabel(['missing'])
  const loadNotice = recoveredParts
    ? t('recovery.recoveredNotice', { parts: recoveredParts })
    : corruptParts
      ? t('recovery.corruptNotice', { parts: corruptParts })
      : missingParts
        ? t('recovery.missingNotice', { parts: missingParts })
        : null

  const finishOnboarding = (deckId?: string) => {
    setSettings({ onboardingDone: true })
    if (deckId && data.decks.some((deck) => deck.id === deckId)) startStudy(deckId)
  }

  if (!data.settings.onboardingDone) {
    return (
      <div className="onboarding-app">
        <TitleBar />
        <Onboarding onFinish={finishOnboarding} />
      </div>
    )
  }

  return (
    <>
      {!zen && loadNotice && saveState.status !== 'error' && (
        <div className="app-banner" role="status">
          <Icon name="alert" size={16} />
          <span>{loadNotice}</span>
          <button
            type="button"
            className="app-banner-close"
            onClick={clearLoadIssues}
            aria-label={t('common.close')}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {saveState.status === 'error' && (
        <div className="app-banner app-banner--error" role="alert">
          <Icon name="alert" size={16} />
          <span>{t('save.errorText')}</span>
          <button type="button" className="app-banner-action" onClick={retrySave}>
            <Icon name="rotate" size={14} />
            {t('save.retry')}
          </button>
        </div>
      )}
      <div className={`app${zen ? ' app--zen' : ''}`} inert={zen ? true : undefined}>
        <TitleBar />
      {session ? (
        <Session
          key={`${session.deckId}-${session.mode}-${session.items[0]?.cardId ?? 'empty'}`}
          deckId={session.deckId}
          items={session.items}
          mode={session.mode}
          title={session.title}
          restartItems={() => {
            if (session.custom) {
              const chunk = customChunkRef.current
              if (chunk) {
                return chunk.pool.slice(chunk.offset, chunk.offset + chunk.size)
              }
              return buildCustomStudyQueue(
                data.cards,
                data.decks,
                session.custom as CustomStudyOptions,
                Date.now(),
              )
            }
            const now = Date.now()
            const deck =
              session.deckId === 'all'
                ? undefined
                : data.decks.find((item) => item.id === session.deckId)
            let items = buildStudyQueue(
              data.cards,
              data.decks,
              session.deckId,
              data.history,
              data.settings,
              now,
            )
            if (!items.length) items = practiceQueue(data.cards, session.deckId, now)
            return limitStudySession(items, sessionSizeForDeck(deck, data.settings))
          }}
          onRestart={
            session.custom
              ? () => {
                  const chunk = customChunkRef.current
                  if (chunk) chunk.offset += chunk.size
                }
              : undefined
          }
          onClose={() => void closeSession()}
        />
      ) : (
        <div className="app-body">
          <Sidebar
            route={route}
            onNavigate={navigate}
            onZen={() => setZen(true)}
            onSearch={() => setPaletteOpen(true)}
          />
          <main className="main" ref={mainRef}>
            <Suspense fallback={<PageLoader />}>
            {route.name === 'home' && (
              <Home
                onNavigate={navigate}
                onStudy={startStudy}
                onCustomStudy={startCustomStudy}
              />
            )}
            {route.name === 'decks' && <Decks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'kanji' && <KanjiDecks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'cards' && (
              <CardBrowser focusCardId={route.cardId} initialQuery={route.query} />
            )}
            {route.name === 'problems' && (
              <ProblemCards
                onStudy={() =>
                  startCustomStudy(
                    {
                      deckId: 'all',
                      status: 'problems',
                      kind: 'all',
                      limit: 0,
                      sessionSize: data.settings.sessionSize,
                    },
                    t('problemCards.studyTitle'),
                  )
                }
                onOpenCard={(cardId) => navigate({ name: 'cards', cardId })}
              />
            )}
            {route.name === 'deck' && (
              <DeckDetail deckId={route.deckId} onNavigate={navigate} onStudy={startStudy} />
            )}
            {route.name === 'stats' && <Stats />}
            {route.name === 'data' && <Data />}
            {route.name === 'settings' && (
              <Settings
                onZen={() => setZen(true)}
                update={updateState}
                updateChecking={updateChecking}
                onCheckUpdates={() => void checkUpdates(true)}
              />
            )}
            {route.name === 'help' && (
              <Help
                onOpenTtsHelp={() => navigate({ name: 'ttsHelp' })}
                onOpenGuide={(guideId) => navigate({ name: 'helpGuide', guideId })}
              />
            )}
            {route.name === 'helpGuide' && (
              <HelpGuidePage
                guideId={route.guideId}
                onBack={() => navigate({ name: 'help' })}
                onNavigate={navigate}
              />
            )}
            {route.name === 'ttsHelp' && <TtsHelp onBack={() => navigate({ name: 'help' })} />}
            {route.name === 'kanamap' && (
              <KanaMap
                onStudyCard={(cardId, deckId) => {
                  const card = data.cards.find((c) => c.id === cardId)
                  const items = [{ cardId, isNew: !card?.srs.introduced }]
                  if (!items.length) return
                  const deck = data.decks.find((item) => item.id === deckId)
                  setSession({
                    deckId,
                    items,
                    mode: effectiveStudyMode(deck, data.settings.studyMode),
                  })
                }}
              />
            )}
            </Suspense>
          </main>
        </div>
      )}
      </div>
      {zen && <ZenMode cards={data.cards} onClose={() => setZen(false)} />}
      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} onNavigate={navigate} />
      )}
      {shortcutsOpen && <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />}
      {ttsNotice && (
        <div className="app-toast" role="status">
          <Icon name="speaker" size={16} />
          <div className="app-toast-body">
            <span className="app-toast-text">{ttsNotice.message}</span>
            {ttsNotice.reason === 'missing-voice' && (
              <button type="button" className="app-toast-link" onClick={openTtsHelp}>
                {t('tts.openHelp')}
                <Icon name="chevron-right" size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            className="app-toast-close"
            onClick={() => setTtsNotice(null)}
            aria-label={t('tts.dismiss')}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <I18nProvider>
          <Shell />
        </I18nProvider>
      </StoreProvider>
    </ErrorBoundary>
  )
}
