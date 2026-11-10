import { useCallback, useEffect, useRef, useState } from 'react'
import type { QueueItem, Route, StudyMode } from './types'
import { StoreProvider, useStore } from './state/store'
import { I18nProvider, useI18n } from './lib/i18n-react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Session } from './components/Session'
import { Icon } from './components/Icon'
import { Home } from './pages/Home'
import { Decks, DeckDetail } from './pages/Decks'
import { KanjiDecks } from './pages/KanjiDecks'
import { CardBrowser } from './pages/CardBrowser'
import { Stats } from './pages/Stats'
import { Data } from './pages/Data'
import { Settings } from './pages/Settings'
import { KanaMap } from './pages/KanaMap'
import { Help } from './pages/Help'
import { HelpGuidePage } from './pages/HelpGuidePage'
import { TtsHelp } from './pages/TtsHelp'
import { ZenMode } from './components/ZenMode'
import { effectiveStudyMode } from './lib/deck-settings'
import { practiceQueue, buildStudyQueue } from './lib/study'
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
  const { data } = useStore()
  const { t } = useI18n()
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [zen, setZen] = useState(false)
  const [ttsNotice, setTtsNotice] = useState<TtsNotice | null>(null)
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: 'idle',
    currentVersion: APP_VERSION,
  })
  const [updateChecking, setUpdateChecking] = useState(false)
  const updateCheckedRef = useRef(false)
  const mainRef = useRef<HTMLElement>(null)

  const checkUpdates = useCallback(async () => {
    setUpdateChecking(true)
    setUpdateState((previous) => ({ ...previous, status: 'checking' }))
    const result = await checkForUpdates()
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
    setSession(null)
    setRoute(next)
  }

  const openTtsHelp = () => {
    setTtsNotice(null)
    navigate({ name: 'ttsHelp' })
  }

  const startStudy = (deckId: string) => {
    const now = Date.now()
    let items = buildStudyQueue(
      data.cards,
      data.decks,
      deckId,
      data.history,
      data.settings,
      now,
    )
    if (!items.length) items = practiceQueue(data.cards, deckId, now)
    if (!items.length) return
    const deck = deckId === 'all' ? undefined : data.decks.find((item) => item.id === deckId)
    setSession({
      deckId,
      items,
      mode: effectiveStudyMode(deck, data.settings.studyMode),
    })
  }

  const startCustomStudy = (options: CustomStudyOptions, title: string): boolean => {
    const items = buildCustomStudyQueue(data.cards, data.decks, options, Date.now())
    if (!items.length) return false
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

  return (
    <>
      <div className={`app${zen ? ' app--zen' : ''}`} inert={zen ? true : undefined}>
        <TitleBar />
      {session ? (
        <Session
          key={`${session.deckId}-${session.mode}-${session.items[0]?.cardId ?? 'empty'}`}
          deckId={session.deckId}
          items={session.items}
          mode={session.mode}
          title={session.title}
          restartItems={
            session.custom
              ? () =>
                  buildCustomStudyQueue(
                    data.cards,
                    data.decks,
                    session.custom as CustomStudyOptions,
                    Date.now(),
                  )
              : undefined
          }
          onClose={() => setSession(null)}
        />
      ) : (
        <div className="app-body">
          <Sidebar route={route} onNavigate={navigate} onZen={() => setZen(true)} />
          <main className="main" ref={mainRef}>
            {route.name === 'home' && (
              <Home
                onNavigate={navigate}
                onStudy={startStudy}
                onCustomStudy={startCustomStudy}
              />
            )}
            {route.name === 'decks' && <Decks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'kanji' && <KanjiDecks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'cards' && <CardBrowser />}
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
                onCheckUpdates={() => void checkUpdates()}
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
          </main>
        </div>
      )}
      </div>
      {zen && <ZenMode cards={data.cards} onClose={() => setZen(false)} />}
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
    <StoreProvider>
      <I18nProvider>
        <Shell />
      </I18nProvider>
    </StoreProvider>
  )
}
