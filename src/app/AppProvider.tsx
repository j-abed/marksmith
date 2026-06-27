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
import {
  documentModeKey,
  loadDocumentMode,
  migrateDocumentModeKey,
  saveDocumentMode,
} from '../documents/documentPreferences'
import { draftSnapshot } from '../documents/draftSnapshot'
import {
  detectLinkedFileFormat,
  openMarkdownWithPicker,
  readDocumentFile,
  saveLinkedFile,
  saveMarkdownAsWithPicker,
  saveHtmlAsWithPicker,
  supportsFileSystemAccess,
  importNotice,
  type LinkedFileFormat,
} from '../documents/fileAccess'
import {
  addRecentDocument,
  clearRecentDocuments,
  loadRecentDocuments,
  updateRecentDocumentMode,
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
  linkedFileFormat: LinkedFileFormat | null
  linkedFileName: string | null
  recentDocuments: RecentDocument[]
  outline: OutlineHeading[]
  notice: string | null
  clearNotice: () => void
  showNotice: (message: string) => void
  wordCount: number
  headingCount: number
}

const AppContext = createContext<AppContextValue | null>(null)

const EDITOR_MODES: EditorMode[] = [
  'raw',
  'preview',
  'split',
  'hybrid',
  'html',
  'compare',
]

function resolveStoredMode(
  input: { sourceName?: string; title: string },
  fallback: EditorMode = 'raw',
): EditorMode {
  const stored = loadDocumentMode(input, fallback)
  return stored && EDITOR_MODES.includes(stored) ? stored : fallback
}

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
  const [linkedFileFormat, setLinkedFileFormat] = useState<LinkedFileFormat | null>(
    null,
  )
  const [linkedFileName, setLinkedFileName] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [recentDocuments, setRecentDocuments] = useState(loadRecentDocuments)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydrated = useRef(false)
  const lastSavedSnapshot = useRef<string | null>(null)
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null)
  const sourceNameRef = useRef<string | undefined>(undefined)
  const linkedFileFormatRef = useRef<LinkedFileFormat | null>(null)

  const syncLinkedFile = useCallback(
    (handle: FileSystemFileHandle | null, sourceName?: string) => {
      fileHandleRef.current = handle
      setHasFileHandle(handle !== null)
      sourceNameRef.current = sourceName
      setLinkedFileName(sourceName ?? null)
      if (handle && sourceName) {
        const format = detectLinkedFileFormat(sourceName)
        linkedFileFormatRef.current = format
        setLinkedFileFormat(format)
      } else {
        linkedFileFormatRef.current = null
        setLinkedFileFormat(null)
      }
    },
    [],
  )

  const persistDocumentMode = useCallback(
    (mode: EditorMode, title: string, sourceName?: string) => {
      saveDocumentMode(documentModeKey({ sourceName, title }), mode)
      setRecentDocuments(
        updateRecentDocumentMode({ title, sourceName, mode }),
      )
    },
    [],
  )

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
      mode?: EditorMode,
    ) => {
      setRecentDocuments(
        addRecentDocument({
          title,
          markdown,
          sourceName,
          importedFromHtml,
          mode,
        }),
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
      preferredMode?: string,
    ) => {
      sourceNameRef.current = sourceName
      const fallback =
        preferredMode && EDITOR_MODES.includes(preferredMode as EditorMode)
          ? (preferredMode as EditorMode)
          : 'raw'
      const mode = resolveStoredMode({ sourceName, title }, fallback)
      syncLinkedFile(handle, sourceName)
      dispatch({ type: 'loadDocument', title, markdown, mode })
      lastSavedSnapshot.current = null
      recordRecent(title, markdown, sourceName, importedFromHtml, mode)
    },
    [recordRecent, syncLinkedFile],
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
  }, [requestDiscardConfirm, syncLinkedFile])

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

      sourceNameRef.current = entry.sourceName
      applyLoadedDocument(
        entry.title,
        entry.markdown,
        null,
        entry.sourceName,
        entry.importedFromHtml,
        entry.mode,
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
    sourceNameRef.current = undefined
    syncLinkedFile(null)
    const mode = resolveStoredMode({ title: 'Untitled' }, 'raw')
    dispatch({ type: 'newDocument', mode })
    lastSavedSnapshot.current = null
    const msg = 'New document'
    setNotice(msg)
    return msg
  }, [requestDiscardConfirm, syncLinkedFile])

  const saveFile = useCallback(async (): Promise<string | null> => {
    const handle = fileHandleRef.current
    const format = linkedFileFormatRef.current
    if (!handle || !format) {
      return 'Use Save As to choose a file first'
    }

    try {
      const saved = await saveLinkedFile(
        state.document.title,
        state.document.markdown,
        handle,
        format,
      )
      fileHandleRef.current = saved
      setHasFileHandle(true)
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
      })
      recordRecent(
        state.document.title,
        state.document.markdown,
        sourceNameRef.current,
        undefined,
        state.mode,
      )
      return format === 'html' ? 'Saved HTML to file' : 'Saved to file'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save failed'
    }
  }, [recordRecent, state.document.markdown, state.document.title, state.mode])

  const saveFileAs = useCallback(async (): Promise<string | null> => {
    try {
      const handle = await saveMarkdownAsWithPicker(
        state.document.title,
        state.document.markdown,
      )
      if (handle) {
        const previousKey = documentModeKey({
          sourceName: sourceNameRef.current,
          title: state.document.title,
        })
        syncLinkedFile(handle, handle.name)
        migrateDocumentModeKey(
          previousKey,
          documentModeKey({
            sourceName: handle.name,
            title: state.document.title,
          }),
        )
      }
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
      })
      recordRecent(
        state.document.title,
        state.document.markdown,
        sourceNameRef.current,
        undefined,
        state.mode,
      )
      return handle ? 'Saved to file' : 'Downloaded .md'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save failed'
    }
  }, [recordRecent, state.document.markdown, state.document.title, state.mode, syncLinkedFile])

  const saveFileAsHtml = useCallback(async (): Promise<string | null> => {
    try {
      const handle = await saveHtmlAsWithPicker(
        state.document.title,
        state.document.markdown,
      )
      if (handle) {
        sourceNameRef.current = handle.name
        syncLinkedFile(handle, handle.name)
      }
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
      })
      recordRecent(
        state.document.title,
        state.document.markdown,
        sourceNameRef.current,
        undefined,
        state.mode,
      )
      return handle ? 'Saved HTML to file' : 'Downloaded .html'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save HTML failed'
    }
  }, [recordRecent, state.document.markdown, state.document.title, state.mode])

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

  const setMode = useCallback(
    (mode: EditorMode) => {
      dispatch({ type: 'setMode', mode })
      persistDocumentMode(mode, state.document.title, sourceNameRef.current)
    },
    [persistDocumentMode, state.document.title],
  )

  const setTitle = useCallback(
    (title: string) => {
      const previousTitle = state.document.title
      if (title === previousTitle) return
      if (!sourceNameRef.current) {
        migrateDocumentModeKey(
          documentModeKey({ title: previousTitle }),
          documentModeKey({ title }),
        )
      }
      dispatch({ type: 'setTitle', title })
    },
    [state.document.title],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      setMarkdown: (markdown) => dispatch({ type: 'setMarkdown', markdown }),
      setTitle,
      setMode,
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
      linkedFileFormat,
      linkedFileName,
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
      setTitle,
      setMode,
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
      linkedFileFormat,
      linkedFileName,
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
