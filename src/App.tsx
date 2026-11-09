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
import { remainingNewToday } from './lib/stats'
import { practiceQueue, studyQueue } from './lib/study'

interface ActiveSession {
  deckId: string
  items: QueueItem[]
  mode: StudyMode
}

function Shell() {
  const { data } = useStore()
  const [route, setRoute] = useState<Route>({ name: 'home' })
  const [session, setSession] = useState<ActiveSession | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [route])

  const navigate = (next: Route) => {
    setSession(null)
    setRoute(next)
  }

  const startStudy = (deckId: string) => {
    const now = Date.now()
    const limit = remainingNewToday(data.history, data.settings, now)
    let items = studyQueue(data.cards, deckId, limit, now)
    if (!items.length) items = practiceQueue(data.cards, deckId, now)
    if (!items.length) return
    setSession({ deckId, items, mode: data.settings.studyMode })
  }

  return (
    <div className="app">
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
          <Sidebar route={route} onNavigate={navigate} />
          <main className="main" ref={mainRef}>
            {route.name === 'home' && <Home onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'decks' && <Decks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'kanji' && <KanjiDecks onNavigate={navigate} onStudy={startStudy} />}
            {route.name === 'cards' && <CardBrowser />}
            {route.name === 'deck' && (
              <DeckDetail deckId={route.deckId} onNavigate={navigate} onStudy={startStudy} />
            )}
            {route.name === 'stats' && <Stats />}
            {route.name === 'settings' && <Settings />}
            {route.name === 'kanamap' && (
              <KanaMap
                onStudyCard={(cardId, deckId) => {
                  const card = data.cards.find((c) => c.id === cardId)
                  const items = [{ cardId, isNew: !card?.srs.introduced }]
                  if (!items.length) return
                  setSession({ deckId, items, mode: data.settings.studyMode })
                }}
              />
            )}
          </main>
        </div>
      )}
    </div>
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
