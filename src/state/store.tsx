import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, DayStat, Rating, RatingUndo, Settings, StudyMode } from '../types'
import {
  ALL_DIRTY,
  combineLoadedParts,
  loadStorage,
  partsForFlags,
  saveStorage,
  saveStorageSync,
  type DirtyFlags,
} from '../lib/storage'
import { normalizeData } from '../lib/normalize'
import { applyRating, freshSrs } from '../lib/srs'
import { dayKey } from '../lib/utils'

interface StoreValue {
  data: AppData
  update: (fn: (draft: AppData) => void) => void
  rateCard: (
    cardId: string,
    rating: Rating,
    elapsedMs: number,
    mode: StudyMode,
  ) => RatingUndo | null
  undoRating: (snapshot: RatingUndo) => void
  setSettings: (patch: Partial<Settings>) => void
  replaceData: (raw: unknown) => void
  resetProgress: () => void
  resetDeckProgress: (deckId: string) => void
  flush: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

async function readStored(): Promise<unknown> {
  try {
    const parts = await loadStorage()
    return parts ? combineLoadedParts(parts) : null
  } catch {
    return null
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const dataRef = useRef<AppData | null>(null)
  dataRef.current = data

  /** Какие части нужно записать при следующем сохранении. */
  const dirtyRef = useRef<DirtyFlags>({ ...ALL_DIRTY })
  const savingRef = useRef(false)
  const savingPromiseRef = useRef<Promise<void> | null>(null)
  const inflightFlagsRef = useRef<DirtyFlags | null>(null)
  const saveAgainRef = useRef(false)

  useEffect(() => {
    let alive = true
    void readStored().then((raw) => {
      if (alive) setData(normalizeData(raw))
    })
    return () => {
      alive = false
    }
  }, [])

  const persistDirty = useCallback(async () => {
    if (savingRef.current) {
      saveAgainRef.current = true
      return
    }

    const current = dataRef.current
    if (!current) return

    const flags = { ...dirtyRef.current }
    if (!flags.content && !flags.settings && !flags.progress && !flags.history) return

    dirtyRef.current = { content: false, settings: false, progress: false, history: false }
    inflightFlagsRef.current = flags
    const parts = partsForFlags(current, flags)

    savingRef.current = true
    const task = saveStorage(parts).catch(() => {
      dirtyRef.current = {
        content: dirtyRef.current.content || flags.content,
        settings: dirtyRef.current.settings || flags.settings,
        progress: dirtyRef.current.progress || flags.progress,
        history: dirtyRef.current.history || flags.history,
      }
    })
    savingPromiseRef.current = task
    try {
      await task
    } finally {
      if (savingPromiseRef.current === task) savingPromiseRef.current = null
      savingRef.current = false
      inflightFlagsRef.current = null
      if (saveAgainRef.current) {
        saveAgainRef.current = false
        window.setTimeout(() => void persistDirty(), 0)
      }
    }
  }, [])

  useEffect(() => {
    if (!data) return
    const timer = window.setTimeout(() => {
      void persistDirty()
    }, 180)
    return () => window.clearTimeout(timer)
  }, [data, persistDirty])

  useEffect(() => {
    const theme = data?.settings.theme ?? 'system'
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }
    apply()
    if (theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
    return undefined
  }, [data?.settings.theme])

  const apply = useCallback((fn: (draft: AppData) => void, dirty: Partial<DirtyFlags>) => {
    dirtyRef.current = { ...dirtyRef.current, ...dirty }
    setData((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }, [])

  const update = useCallback(
    (fn: (draft: AppData) => void) => {
      apply(fn, { content: true })
    },
    [apply],
  )

  const rateCard = useCallback(
    (
      cardId: string,
      rating: Rating,
      elapsedMs: number,
      mode: StudyMode,
    ): RatingUndo | null => {
      const prev = dataRef.current
      const card = prev?.cards.find((item) => item.id === cardId)
      if (!prev || !card) return null

      const now = Date.now()
      const historyKey = dayKey(now)
      const previousDay = prev.history[historyKey]
      const snapshot: RatingUndo = {
        cardId,
        srs: { ...card.srs },
        historyKey,
        day: previousDay ? { ...previousDay } : null,
      }

      dirtyRef.current.progress = true
      dirtyRef.current.history = true

      setData((current) => {
        if (!current) return current
        const index = current.cards.findIndex((item) => item.id === cardId)
        if (index < 0) return current

        const target = current.cards[index]
        const wasNew = !target.srs.introduced
        const cards = current.cards.slice()
        cards[index] = { ...target, srs: applyRating(target.srs, rating, now) }

        const elapsed = Math.min(Math.max(0, elapsedMs), 120_000)
        const previousDayState = current.history[historyKey]
        const day: DayStat = previousDayState
          ? { ...previousDayState }
          : { reviews: 0, correct: 0, newCards: 0, ms: 0 }
        if (previousDayState?.writing) day.writing = { ...previousDayState.writing }
        if (previousDayState?.newByDeck) day.newByDeck = { ...previousDayState.newByDeck }
        if (previousDayState?.reviewByDeck) {
          day.reviewByDeck = { ...previousDayState.reviewByDeck }
        }

        day.reviews += 1
        if (rating !== 'again') day.correct += 1
        if (wasNew) day.newCards += 1
        day.ms += elapsed

        const reviewByDeck = day.reviewByDeck ?? {}
        reviewByDeck[target.deckId] = (reviewByDeck[target.deckId] ?? 0) + 1
        day.reviewByDeck = reviewByDeck

        if (wasNew) {
          const newByDeck = day.newByDeck ?? {}
          newByDeck[target.deckId] = (newByDeck[target.deckId] ?? 0) + 1
          day.newByDeck = newByDeck
        }

        if (mode === 'writing') {
          const writing = day.writing ?? { reviews: 0, correct: 0, newCards: 0, ms: 0 }
          writing.reviews += 1
          if (rating !== 'again') writing.correct += 1
          if (wasNew) writing.newCards += 1
          writing.ms += elapsed
          day.writing = writing
        }

        return {
          ...current,
          cards,
          history: { ...current.history, [historyKey]: day },
        }
      })

      return snapshot
    },
    [],
  )

  const undoRating = useCallback((snapshot: RatingUndo) => {
    dirtyRef.current.progress = true
    dirtyRef.current.history = true

    setData((prev) => {
      if (!prev) return prev
      const index = prev.cards.findIndex((item) => item.id === snapshot.cardId)
      const cards = prev.cards.slice()
      if (index >= 0) cards[index] = { ...cards[index], srs: { ...snapshot.srs } }

      const history = { ...prev.history }
      if (snapshot.day) {
        history[snapshot.historyKey] = { ...snapshot.day }
      } else {
        delete history[snapshot.historyKey]
      }

      return { ...prev, cards, history }
    })
  }, [])

  const setSettings = useCallback((patch: Partial<Settings>) => {
    dirtyRef.current.settings = true
    setData((prev) =>
      prev ? { ...prev, settings: { ...prev.settings, ...patch } } : prev,
    )
  }, [])

  const replaceData = useCallback((raw: unknown) => {
    dirtyRef.current = { ...ALL_DIRTY }
    setData(normalizeData(raw))
  }, [])

  const resetProgress = useCallback(() => {
    dirtyRef.current.progress = true
    dirtyRef.current.history = true
    setData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.map((card) => ({ ...card, srs: freshSrs() })),
            history: {},
          }
        : prev,
    )
  }, [])

  const resetDeckProgress = useCallback((deckId: string) => {
    dirtyRef.current.progress = true
    setData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.map((card) =>
              card.deckId === deckId ? { ...card, srs: freshSrs() } : card,
            ),
          }
        : prev,
    )
  }, [])

  const flush = useCallback(async () => {
    // Дожидаемся уже идущей записи, затем отправляем всё, что накопилось.
    if (savingPromiseRef.current) {
      try {
        await savingPromiseRef.current
      } catch {
        /* ignore */
      }
    }
    await persistDirty()
  }, [persistDirty])

  const flushSync = useCallback(() => {
    const current = dataRef.current
    if (!current) return

    const inflight = inflightFlagsRef.current
    const flags: DirtyFlags = {
      content: dirtyRef.current.content || Boolean(inflight?.content),
      settings: dirtyRef.current.settings || Boolean(inflight?.settings),
      progress: dirtyRef.current.progress || Boolean(inflight?.progress),
      history: dirtyRef.current.history || Boolean(inflight?.history),
    }
    if (!flags.content && !flags.settings && !flags.progress && !flags.history) return

    const parts = partsForFlags(current, flags)
    try {
      saveStorageSync(parts)
      dirtyRef.current = { content: false, settings: false, progress: false, history: false }
    } catch {
      /* не блокируем закрытие окна */
    }
  }, [])

  useEffect(() => {
    const onUnload = () => flushSync()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [flushSync])

  const value = useMemo<StoreValue | null>(() => {
    if (!data) return null
    return {
      data,
      update,
      rateCard,
      undoRating,
      setSettings,
      replaceData,
      resetProgress,
      resetDeckProgress,
      flush,
    }
  }, [
    data,
    update,
    rateCard,
    undoRating,
    setSettings,
    replaceData,
    resetProgress,
    resetDeckProgress,
    flush,
  ])

  if (!value) {
    return (
      <div className="splash">
        <div className="splash-mark">言</div>
        <div className="splash-title">Котоба</div>
        <div className="splash-bar">
          <span />
        </div>
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
