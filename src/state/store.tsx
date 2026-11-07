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
import type { AppData, Rating, RatingUndo, Settings } from '../types'
import { normalizeData } from '../lib/normalize'
import { applyRating, freshSrs } from '../lib/srs'
import { dayKey } from '../lib/utils'

const STORAGE_KEY = 'kotoba-data-v1'

interface StoreValue {
  data: AppData
  update: (fn: (draft: AppData) => void) => void
  rateCard: (cardId: string, rating: Rating, elapsedMs: number) => RatingUndo | null
  undoRating: (snapshot: RatingUndo) => void
  setSettings: (patch: Partial<Settings>) => void
  replaceData: (raw: unknown) => void
  resetProgress: () => void
  flush: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

async function readStored(): Promise<unknown> {
  if (window.kotoba) {
    try {
      return await window.kotoba.load()
    } catch {
      return null
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(data: AppData): Promise<boolean> {
  if (window.kotoba) return window.kotoba.save(data)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
  return Promise.resolve(true)
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const dataRef = useRef<AppData | null>(null)
  dataRef.current = data

  useEffect(() => {
    let alive = true
    void readStored().then((raw) => {
      if (alive) setData(normalizeData(raw))
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!data) return
    const timer = window.setTimeout(() => {
      void writeStored(data)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [data])

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

  const update = useCallback((fn: (draft: AppData) => void) => {
    setData((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }, [])

  const rateCard = useCallback(
    (cardId: string, rating: Rating, elapsedMs: number): RatingUndo | null => {
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

      setData((current) => {
        if (!current) return current
        const target = current.cards.find((item) => item.id === cardId)
        if (!target) return current

        const next = structuredClone(current)
        const nextTarget = next.cards.find((item) => item.id === cardId)
        if (!nextTarget) return current

        const wasNew = !nextTarget.srs.introduced
        nextTarget.srs = applyRating(nextTarget.srs, rating, now)

        const day = next.history[historyKey] ?? { reviews: 0, correct: 0, newCards: 0, ms: 0 }
        day.reviews += 1
        if (rating !== 'again') day.correct += 1
        if (wasNew) day.newCards += 1
        day.ms += Math.min(Math.max(0, elapsedMs), 120_000)
        next.history[historyKey] = day

        return next
      })

      return snapshot
    },
    [],
  )

  const undoRating = useCallback((snapshot: RatingUndo) => {
    setData((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      const target = next.cards.find((item) => item.id === snapshot.cardId)
      if (target) target.srs = { ...snapshot.srs }
      if (snapshot.day) {
        next.history[snapshot.historyKey] = { ...snapshot.day }
      } else {
        delete next.history[snapshot.historyKey]
      }
      return next
    })
  }, [])

  const setSettings = useCallback(
    (patch: Partial<Settings>) => {
      update((draft) => {
        draft.settings = { ...draft.settings, ...patch }
      })
    },
    [update],
  )

  const replaceData = useCallback((raw: unknown) => {
    setData(normalizeData(raw))
  }, [])

  const resetProgress = useCallback(() => {
    update((draft) => {
      draft.cards = draft.cards.map((card) => ({ ...card, srs: freshSrs() }))
      draft.history = {}
    })
  }, [update])

  const flush = useCallback(async () => {
    if (dataRef.current) await writeStored(dataRef.current)
  }, [])

  const flushSync = useCallback(() => {
    const current = dataRef.current
    if (!current) return
    if (window.kotoba?.saveSync) {
      try {
        window.kotoba.saveSync(current)
      } catch {
        /* ignore */
      }
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onUnload = () => flushSync()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [flushSync])

  const value = useMemo<StoreValue | null>(() => {
    if (!data) return null
    return { data, update, rateCard, undoRating, setSettings, replaceData, resetProgress, flush }
  }, [data, update, rateCard, undoRating, setSettings, replaceData, resetProgress, flush])

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
