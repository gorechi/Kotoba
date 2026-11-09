import { useEffect, useRef, useState } from 'react'
import type { QueueItem, Route, StudyMode } from './types'
import { StoreProvider, useStore } from './state/store'
import { I18nProvider } from './lib/i18n-react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Session } from './components/Session'
import { Home } from './pages/Home'
import { Decks, DeckDetail } from './pages/Decks'
import { KanjiDecks } from './pages/KanjiDecks'
import { CardBrowser } from './pages/CardBrowser'
import { Stats } from './pages/Stats'
import { Settings } from './pages/Settings'
import { KanaMap } from './pages/KanaMap'
import { ZenMode } from './components/ZenMode'
import { effectiveStudyMode } from './lib/deck-settings'
import { practiceQueue, buildStudyQueue } from './lib/study'

interface ActiveSession {
  deckId: string
  items: QueueItem[]
  mode: StudyMode
}

function Shell() {
  const { data } = useStore()
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [zen, setZen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

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
          onClose={() => setSession(null)}
        />
      ) : (
        <div className="app-body">
          <Sidebar route={route} onNavigate={navigate} onZen={() => setZen(true)} />
          <main className="main" ref={mainRef}>
            {route.name === 'home' && <Home onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'decks' && <Decks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'kanji' && <KanjiDecks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'cards' && <CardBrowser />}
            {route.name === 'deck' && (
              <DeckDetail deckId={route.deckId} onNavigate={navigate} onStudy={startStudy} />
            )}
            {route.name === 'stats' && <Stats />}
            {route.name === 'settings' && <Settings onZen={() => setZen(true)} />}
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
