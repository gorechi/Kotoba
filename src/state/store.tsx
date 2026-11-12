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
  type StorageIssue,
  type StorageLoadResult,
} from '../lib/storage'
import { normalizeData } from '../lib/normalize'
import { applyRating, freshSrs } from '../lib/srs'
import { dayKey } from '../lib/utils'
import { RecoveryScreen } from '../components/RecoveryScreen'
import { Splash } from '../components/Splash'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveState {
  status: SaveStatus
  error?: string
}

interface StoreValue {
  data: AppData
  loadIssues: StorageIssue[]
  clearLoadIssues: () => void
  saveState: SaveState
  retrySave: () => void
  update: (fn: (current: AppData) => AppData) => void
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
  flush: () => Promise<boolean>
}

const StoreContext = createContext<StoreValue | null>(null)

/** Пауза после последнего ответа, чтобы собрать пачку изменений прогресса. */
const PROGRESS_SAVE_DELAY = 5000
/** Даже при непрерывной учёбе прогресс пишется не реже этого интервала. */
const MAX_PROGRESS_BATCH_AGE = 10_000

async function readStored(): Promise<StorageLoadResult> {
  try {
    return await loadStorage()
  } catch (error) {
    return {
      parts: null,
      issues: [{ part: 'content', kind: 'load-error', message: String(error) }],
      blocked: true,
    }
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [loadState, setLoadState] = useState<StorageLoadResult | null>(null)
  const [loadIssues, setLoadIssues] = useState<StorageIssue[]>([])
  const blockedRef = useRef(false)
  const loadStartedRef = useRef(false)
  const dataRef = useRef<AppData | null>(null)
  dataRef.current = data

  /** Какие части нужно записать при следующем сохранении. */
  const dirtyRef = useRef<DirtyFlags>({ ...ALL_DIRTY })
  const savingRef = useRef(false)
  const savingPromiseRef = useRef<Promise<void> | null>(null)
  const inflightFlagsRef = useRef<DirtyFlags | null>(null)
  const saveAgainRef = useRef(false)
  const lastProgressChangeRef = useRef(0)
  const lastProgressWriteRef = useRef(0)
  const progressSaveTimerRef = useRef<number | null>(null)
  const lazyPacksRef = useRef(false)
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' })
  const savedTimerRef = useRef<number | null>(null)

  const clearSavedTimer = useCallback(() => {
    if (savedTimerRef.current !== null) {
      window.clearTimeout(savedTimerRef.current)
      savedTimerRef.current = null
    }
  }, [])

  const markSaving = useCallback(() => {
    clearSavedTimer()
    setSaveState((current) => (current.status === 'saving' ? current : { status: 'saving' }))
  }, [clearSavedTimer])

  const markSaved = useCallback(() => {
    clearSavedTimer()
    setSaveState({ status: 'saved' })
    savedTimerRef.current = window.setTimeout(() => {
      savedTimerRef.current = null
      setSaveState((current) => (current.status === 'saved' ? { status: 'idle' } : current))
    }, 2200)
  }, [clearSavedTimer])

  const markSaveError = useCallback(
    (error: unknown) => {
      clearSavedTimer()
      console.error('[kotoba] save failed', error)
      setSaveState({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    },
    [clearSavedTimer],
  )

  useEffect(() => () => clearSavedTimer(), [clearSavedTimer])

  useEffect(
    () => () => {
      if (progressSaveTimerRef.current !== null) {
        window.clearTimeout(progressSaveTimerRef.current)
        progressSaveTimerRef.current = null
      }
    },
    [],
  )

  const applyLoaded = useCallback((result: StorageLoadResult) => {
    blockedRef.current = result.blocked
    setLoadState(result)
    setLoadIssues(result.issues)
    if (result.blocked) {
      setData(null)
      return
    }
    setData(normalizeData(result.parts ? combineLoadedParts(result.parts) : null))
  }, [])

  useEffect(() => {
    // StrictMode в разработке запускает эффект дважды. Чтение с диска — это
    // побочный эффект (оно может переименовать повреждённый файл), поэтому
    // выполняем его один раз; повторный результат мог бы скрыть восстановление.
    if (loadStartedRef.current) return
    loadStartedRef.current = true
    void readStored().then(applyLoaded)
  }, [applyLoaded])

  const persistDirty = useCallback(async (force = false): Promise<boolean> => {
    if (blockedRef.current) return true
    if (savingRef.current) {
      saveAgainRef.current = true
      return false
    }

    const current = dataRef.current
    if (!current) return true

    const flags = { ...dirtyRef.current }
    if (!flags.content && !flags.settings && !flags.progress && !flags.history) return true

    const onlyProgress =
      !flags.content && !flags.settings && (flags.progress || flags.history)

    if (onlyProgress && !force) {
      const now = Date.now()
      const sinceChange = now - lastProgressChangeRef.current
      const sinceWrite = now - lastProgressWriteRef.current
      const delay = Math.min(
        Math.max(0, PROGRESS_SAVE_DELAY - sinceChange),
        Math.max(0, MAX_PROGRESS_BATCH_AGE - sinceWrite),
      )
      if (delay > 0) {
        if (progressSaveTimerRef.current !== null) {
          window.clearTimeout(progressSaveTimerRef.current)
        }
        progressSaveTimerRef.current = window.setTimeout(() => {
          progressSaveTimerRef.current = null
          void persistDirty(true)
        }, delay)
        return true
      }
    }

    if (progressSaveTimerRef.current !== null) {
      window.clearTimeout(progressSaveTimerRef.current)
      progressSaveTimerRef.current = null
    }

    dirtyRef.current = { content: false, settings: false, progress: false, history: false }
    inflightFlagsRef.current = flags
    const parts = partsForFlags(current, flags)

    savingRef.current = true
    markSaving()
    let failed = false
    const task = saveStorage(parts)
      .then(() => {
        if (flags.progress || flags.content) {
          lastProgressWriteRef.current = Date.now()
        }
        markSaved()
      })
      .catch((error) => {
        failed = true
        dirtyRef.current = {
          content: dirtyRef.current.content || flags.content,
          settings: dirtyRef.current.settings || flags.settings,
          progress: dirtyRef.current.progress || flags.progress,
          history: dirtyRef.current.history || flags.history,
        }
        markSaveError(error)
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
    return !failed
  }, [markSaveError, markSaved, markSaving])

  useEffect(() => {
    if (!data) return
    const timer = window.setTimeout(() => {
      void persistDirty()
    }, 180)
    return () => window.clearTimeout(timer)
  }, [data, persistDirty])

  // Kanji packs live in a lazy chunk. Install them after the app shell is
  // ready so their cards do not inflate the initial bundle.
  useEffect(() => {
    if (!data || lazyPacksRef.current) return
    const missing = ['kanji-n5', 'kanji-n4'].some(
      (packId) => !data.installedPacks.includes(packId),
    )
    if (!missing) return

    lazyPacksRef.current = true
    void import('../data/content-packs')
      .then(({ installContentPacks }) => {
        setData((current) => {
          if (!current) return current
          const packed = installContentPacks({
            decks: current.decks,
            cards: current.cards,
            installedPacks: current.installedPacks,
          })
          if (
            packed.decks === current.decks &&
            packed.cards === current.cards &&
            packed.installedPacks === current.installedPacks
          ) {
            return current
          }
          dirtyRef.current = { ...dirtyRef.current, content: true }
          return { ...current, ...packed }
        })
      })
      .catch((error) => {
        lazyPacksRef.current = false
        console.error('[kotoba] could not install kanji packs', error)
      })
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

  const update = useCallback(
    (fn: (current: AppData) => AppData) => {
      dirtyRef.current = { ...dirtyRef.current, content: true }
      setData((current) => (current ? fn(current) : current))
    },
    [],
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
      const historyKey = dayKey(now, prev.settings.dayStartHour)
      const previousDay = prev.history[historyKey]
      const threshold = prev.settings.leechThreshold
      const predicted = applyRating(card.srs, rating, now)
      const autoPaused =
        rating === 'again' &&
        threshold > 0 &&
        predicted.lapses >= threshold &&
        !card.suspended
      const snapshot: RatingUndo = {
        cardId,
        srs: { ...card.srs },
        suspended: Boolean(card.suspended),
        autoPaused,
        historyKey,
        day: previousDay ? { ...previousDay } : null,
      }

      lastProgressChangeRef.current = now
      dirtyRef.current.progress = true
      dirtyRef.current.history = true

      setData((current) => {
        if (!current) return current
        const index = current.cards.findIndex((item) => item.id === cardId)
        if (index < 0) return current

        const target = current.cards[index]
        const wasNew = !target.srs.introduced
        const nextSrs = applyRating(target.srs, rating, now)
        if (rating === 'again') nextSrs.lastMistakeAt = now
        const cards = current.cards.slice()
        cards[index] = {
          ...target,
          srs: nextSrs,
          suspended: autoPaused && !target.suspended ? true : target.suspended,
        }

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
    lastProgressChangeRef.current = Date.now()
    dirtyRef.current.progress = true
    dirtyRef.current.history = true

    setData((prev) => {
      if (!prev) return prev
      const index = prev.cards.findIndex((item) => item.id === snapshot.cardId)
      const cards = prev.cards.slice()
      if (index >= 0) {
        cards[index] = {
          ...cards[index],
          srs: { ...snapshot.srs },
          suspended: snapshot.suspended,
        }
      }

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
    dirtyRef.current.content = true
    setData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.map((card) => ({
              ...card,
              srs: freshSrs(),
            })),
            history: {},
          }
        : prev,
    )
  }, [])

  const resetDeckProgress = useCallback((deckId: string) => {
    dirtyRef.current.progress = true
    dirtyRef.current.content = true
    setData((prev) =>
      prev
        ? {
            ...prev,
            cards: prev.cards.map((card) =>
              card.deckId === deckId
                ? { ...card, srs: freshSrs() }
                : card,
            ),
          }
        : prev,
    )
  }, [])

  const flush = useCallback(async (): Promise<boolean> => {
    if (progressSaveTimerRef.current !== null) {
      window.clearTimeout(progressSaveTimerRef.current)
      progressSaveTimerRef.current = null
    }

    // Дожидаемся уже идущей записи и повторяем, если во время неё появились
    // новые изменения. Возвращаем false, только если записать не удалось.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      if (savingPromiseRef.current) {
        try {
          await savingPromiseRef.current
        } catch {
          /* ошибку обработает persistDirty */
        }
      }
      const saved = await persistDirty(true)
      if (!saved) {
        if (savingRef.current || saveAgainRef.current) continue
        return false
      }
      const hasDirty =
        dirtyRef.current.content ||
        dirtyRef.current.settings ||
        dirtyRef.current.progress ||
        dirtyRef.current.history
      if (!savingRef.current && !saveAgainRef.current && !hasDirty) return true
    }
    markSaveError(new Error('Pending changes were not flushed'))
    return false
  }, [markSaveError, persistDirty])

  const flushSync = useCallback((): boolean => {
    if (progressSaveTimerRef.current !== null) {
      window.clearTimeout(progressSaveTimerRef.current)
      progressSaveTimerRef.current = null
    }
    if (blockedRef.current) return true
    const current = dataRef.current
    if (!current) return true

    const inflight = inflightFlagsRef.current
    const flags: DirtyFlags = {
      content: dirtyRef.current.content || Boolean(inflight?.content),
      settings: dirtyRef.current.settings || Boolean(inflight?.settings),
      progress: dirtyRef.current.progress || Boolean(inflight?.progress),
      history: dirtyRef.current.history || Boolean(inflight?.history),
    }
    if (!flags.content && !flags.settings && !flags.progress && !flags.history) {
      return true
    }

    const parts = partsForFlags(current, flags)
    try {
      if (!saveStorageSync(parts)) {
        markSaveError(new Error('Synchronous save failed'))
        return false
      }
      dirtyRef.current = { content: false, settings: false, progress: false, history: false }
      markSaved()
      return true
    } catch (error) {
      markSaveError(error)
      return false
    }
  }, [markSaveError, markSaved])

  useEffect(() => {
    const onUnload = () => flushSync()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [flushSync])

  const retryLoad = useCallback(() => {
    setLoadState(null)
    setLoadIssues([])
    void readStored().then(applyLoaded)
  }, [applyLoaded])

  const startFresh = useCallback(() => {
    blockedRef.current = false
    setLoadState((previous) =>
      previous ? { ...previous, blocked: false, issues: [] } : previous,
    )
    setLoadIssues([])
    dirtyRef.current = { ...ALL_DIRTY }
    setData(normalizeData(null))
  }, [])

  const importRecovery = useCallback((raw: unknown) => {
    blockedRef.current = false
    setLoadState((previous) =>
      previous ? { ...previous, blocked: false, issues: [] } : previous,
    )
    setLoadIssues([])
    dirtyRef.current = { ...ALL_DIRTY }
    setData(normalizeData(raw))
  }, [])

  const clearLoadIssues = useCallback(() => setLoadIssues([]), [])

  const retrySave = useCallback(() => {
    void persistDirty(true)
  }, [persistDirty])

  const value = useMemo<StoreValue | null>(() => {
    if (!data) return null
    return {
      data,
      loadIssues,
      clearLoadIssues,
      saveState,
      retrySave,
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
    loadIssues,
    clearLoadIssues,
    saveState,
    retrySave,
    update,
    rateCard,
    undoRating,
    setSettings,
    replaceData,
    resetProgress,
    resetDeckProgress,
    flush,
  ])

  if (loadState?.blocked) {
    return (
      <RecoveryScreen
        result={loadState}
        onRetry={retryLoad}
        onStartFresh={startFresh}
        onImport={importRecovery}
      />
    )
  }

  if (!value) {
    return <Splash />
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
