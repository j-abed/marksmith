import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AUTOSAVE_DEBOUNCE_MS, loadDraft, saveDraft } from '../documents/autosave'
import { draftSnapshot } from '../documents/draftSnapshot'
import {
  openMarkdownWithPicker,
  readDocumentFile,
  saveMarkdownAsWithPicker,
  saveMarkdownWithPicker,
  saveHtmlAsWithPicker,
  supportsFileSystemAccess,
  importNotice,
} from '../documents/fileAccess'
import {
  addRecentDocument,
  clearRecentDocuments,
  loadRecentDocuments,
  type RecentDocument,
} from '../documents/recentDocuments'
import { countWords } from '../markdown/wordCount'
import { extractOutline, type OutlineHeading } from '../markdown/outline'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  appReducer,
  createDocument,
  resolveInitialTheme,
  type AppState,
  type EditorMode,
  type Theme,
} from './appState'

type AppContextValue = {
  state: AppState
  setMarkdown: (markdown: string) => void
  setTitle: (title: string) => void
  setMode: (mode: EditorMode) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleZenMode: () => void
  newDocument: () => Promise<string | null>
  openFileFromPicker: (onResult: (message: string | null) => void) => void
  openFileFromInput: () => Promise<void>
  openRecentDocument: (id: string) => Promise<string | null>
  clearRecent: () => void
  saveFile: () => Promise<string | null>
  saveFileAs: () => Promise<string | null>
  saveFileAsHtml: () => Promise<string | null>
  loadFromFile: (file: File) => Promise<string | null>
  canSaveToDisk: boolean
  recentDocuments: RecentDocument[]
  outline: OutlineHeading[]
  notice: string | null
  clearNotice: () => void
  showNotice: (message: string) => void
  wordCount: number
  headingCount: number
}

const AppContext = createContext<AppContextValue | null>(null)

const initialState: AppState = {
  document: createDocument(),
  mode: 'raw',
  theme: resolveInitialTheme(),
  saveStatus: 'saved',
  zenMode: false,
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [hasFileHandle, setHasFileHandle] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [recentDocuments, setRecentDocuments] = useState(loadRecentDocuments)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydrated = useRef(false)
  const lastSavedSnapshot = useRef<string | null>(null)
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  const requestDiscardConfirm = useCallback((): Promise<boolean> => {
    if (!state.document.dirty) return Promise.resolve(true)
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve
      setConfirmOpen(true)
    })
  }, [state.document.dirty])

  const handleConfirmDiscard = useCallback(() => {
    setConfirmOpen(false)
    confirmResolverRef.current?.(true)
    confirmResolverRef.current = null
  }, [])

  const handleCancelDiscard = useCallback(() => {
    setConfirmOpen(false)
    confirmResolverRef.current?.(false)
    confirmResolverRef.current = null
  }, [])

  const recordRecent = useCallback(
    (
      title: string,
      markdown: string,
      sourceName?: string,
      importedFromHtml?: boolean,
    ) => {
      setRecentDocuments(
        addRecentDocument({ title, markdown, sourceName, importedFromHtml }),
      )
    },
    [],
  )

  const applyLoadedDocument = useCallback(
    (
      title: string,
      markdown: string,
      handle: FileSystemFileHandle | null,
      sourceName?: string,
      importedFromHtml?: boolean,
    ) => {
      fileHandleRef.current = handle
      setHasFileHandle(handle !== null)
      dispatch({ type: 'loadDocument', title, markdown })
      lastSavedSnapshot.current = null
      recordRecent(title, markdown, sourceName, importedFromHtml)
    },
    [recordRecent],
  )

  const loadFileDirectly = useCallback(
    async (file: File): Promise<string | null> => {
      const opened = await readDocumentFile(file)
      applyLoadedDocument(
        opened.title,
        opened.markdown,
        opened.handle,
        file.name,
        opened.convertedFromHtml,
      )
      const msg = importNotice(opened.title, opened.convertedFromHtml)
      setNotice(msg)
      return msg
    },
    [applyLoadedDocument],
  )

  const loadFromFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (!(await requestDiscardConfirm())) return null
      return loadFileDirectly(file)
    },
    [loadFileDirectly, requestDiscardConfirm],
  )

  const openFileFromInput = useCallback(async () => {
    if (!(await requestDiscardConfirm())) return
    fileInputRef.current?.click()
  }, [requestDiscardConfirm])

  const openFileFromPicker = useCallback(
    (onResult: (message: string | null) => void) => {
      void (async () => {
        if (!(await requestDiscardConfirm())) {
          onResult(null)
          return
        }

        if (supportsFileSystemAccess()) {
          try {
            const picked = await openMarkdownWithPicker()
            if (!picked) {
              onResult(null)
              return
            }
            applyLoadedDocument(
              picked.title,
              picked.markdown,
              picked.handle,
              picked.handle?.name,
              picked.convertedFromHtml,
            )
            const msg = importNotice(picked.title, picked.convertedFromHtml)
            setNotice(msg)
            onResult(msg)
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
              onResult(null)
              return
            }
            fileInputRef.current?.click()
            onResult(null)
          }
          return
        }

        fileInputRef.current?.click()
        onResult(null)
      })()
    },
    [applyLoadedDocument, requestDiscardConfirm],
  )

  const openRecentDocument = useCallback(
    async (id: string): Promise<string | null> => {
      const entry = recentDocuments.find((doc) => doc.id === id)
      if (!entry) return null
      if (!(await requestDiscardConfirm())) return null

      fileHandleRef.current = null
      setHasFileHandle(false)
      applyLoadedDocument(
        entry.title,
        entry.markdown,
        null,
        entry.sourceName,
        entry.importedFromHtml,
      )
      const msg = `Opened ${entry.title}`
      setNotice(msg)
      return msg
    },
    [applyLoadedDocument, recentDocuments, requestDiscardConfirm],
  )

  const clearRecent = useCallback(() => {
    clearRecentDocuments()
    setRecentDocuments([])
    setNotice('Recent documents cleared')
  }, [])

  const newDocument = useCallback(async (): Promise<string | null> => {
    if (!(await requestDiscardConfirm())) return null
    fileHandleRef.current = null
    setHasFileHandle(false)
    dispatch({ type: 'newDocument' })
    lastSavedSnapshot.current = null
    const msg = 'New document'
    setNotice(msg)
    return msg
  }, [requestDiscardConfirm])

  const saveFile = useCallback(async (): Promise<string | null> => {
    if (!fileHandleRef.current) {
      return 'Use Save As to choose a file first'
    }

    try {
      const handle = await saveMarkdownWithPicker(
        state.document.title,
        state.document.markdown,
        fileHandleRef.current,
      )
      if (handle) {
        fileHandleRef.current = handle
        setHasFileHandle(true)
      }
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
      })
      recordRecent(state.document.title, state.document.markdown)
      return 'Saved to file'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save failed'
    }
  }, [recordRecent, state.document.markdown, state.document.title])

  const saveFileAs = useCallback(async (): Promise<string | null> => {
    try {
      const handle = await saveMarkdownAsWithPicker(
        state.document.title,
        state.document.markdown,
      )
      if (handle) {
        fileHandleRef.current = handle
        setHasFileHandle(true)
      }
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
      })
      recordRecent(state.document.title, state.document.markdown)
      return handle ? 'Saved to file' : 'Downloaded .md'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save failed'
    }
  }, [recordRecent, state.document.markdown, state.document.title])

  const saveFileAsHtml = useCallback(async (): Promise<string | null> => {
    try {
      const handle = await saveHtmlAsWithPicker(
        state.document.title,
        state.document.markdown,
      )
      recordRecent(state.document.title, state.document.markdown)
      return handle ? 'Saved HTML to file' : 'Downloaded .html'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save HTML failed'
    }
  }, [recordRecent, state.document.markdown, state.document.title])

  useEffect(() => {
    const draft = loadDraft()
    if (draft?.document) {
      dispatch({
        type: 'restoreDocument',
        document: { ...draft.document, dirty: false },
        mode: draft.mode as EditorMode | undefined,
        theme: draft.theme as Theme | undefined,
      })
    }
    hydrated.current = true
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    document.documentElement.style.colorScheme = state.theme
    document.documentElement.classList.toggle('zen-mode', state.zenMode)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute(
        'content',
        state.theme === 'dark' ? '#0f1117' : '#f7f8fa',
      )
    }
    try {
      localStorage.setItem('marksmith:theme', state.theme)
    } catch {
      // ignore
    }
  }, [state.theme, state.zenMode])

  useEffect(() => {
    if (!hydrated.current) return

    const snapshot = draftSnapshot(state)

    if (lastSavedSnapshot.current === null) {
      lastSavedSnapshot.current = snapshot
      return
    }

    if (snapshot === lastSavedSnapshot.current) return

    if (saveTimer.current) clearTimeout(saveTimer.current)

    if (state.document.dirty) {
      dispatch({ type: 'setSaveStatus', saveStatus: 'saving' })
    }

    saveTimer.current = setTimeout(() => {
      saveDraft({
        document: { ...state.document, dirty: false },
        mode: state.mode,
        theme: state.theme,
      })
      lastSavedSnapshot.current = snapshot
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
      })
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [
    state.document.markdown,
    state.document.title,
    state.document.dirty,
    state.mode,
    state.theme,
  ])

  const outline = useMemo(
    () => extractOutline(state.document.markdown),
    [state.document.markdown],
  )
  const wordCount = useMemo(
    () => countWords(state.document.markdown),
    [state.document.markdown],
  )
  const headingCount = outline.length

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      setMarkdown: (markdown) => dispatch({ type: 'setMarkdown', markdown }),
      setTitle: (title) => dispatch({ type: 'setTitle', title }),
      setMode: (mode) => dispatch({ type: 'setMode', mode }),
      setTheme: (theme) => dispatch({ type: 'setTheme', theme }),
      toggleTheme: () => dispatch({ type: 'toggleTheme' }),
      toggleZenMode: () => dispatch({ type: 'toggleZenMode' }),
      newDocument,
      openFileFromPicker,
      openFileFromInput,
      openRecentDocument,
      clearRecent,
      saveFile,
      saveFileAs,
      saveFileAsHtml,
      loadFromFile,
      canSaveToDisk: hasFileHandle,
      recentDocuments,
      outline,
      notice,
      clearNotice: () => setNotice(null),
      showNotice: (message) => setNotice(message),
      wordCount,
      headingCount,
    }),
    [
      state,
      newDocument,
      openFileFromPicker,
      openFileFromInput,
      openRecentDocument,
      clearRecent,
      saveFile,
      saveFileAs,
      saveFileAsHtml,
      loadFromFile,
      hasFileHandle,
      recentDocuments,
      outline,
      wordCount,
      headingCount,
      notice,
    ],
  )

  return (
    <AppContext.Provider value={value}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.html,.htm,text/markdown,text/plain,text/html"
        hidden
        data-testid="file-open-input"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void loadFileDirectly(file)
        }}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Unsaved changes"
        message="You have unsaved changes. Discard them and continue?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
