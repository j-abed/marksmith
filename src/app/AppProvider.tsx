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
  loadDocumentSidebarPrefs,
  migrateDocumentModeKey,
  saveDocumentMode,
  saveDocumentSidebarPrefs,
  type DocumentSidebarPrefs,
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
  openDocumentFromPath,
  openDocumentWithDesktopDialog,
  saveDesktopLinkedFile,
  saveHtmlAsWithDesktopDialog,
  saveMarkdownAsWithDesktopDialog,
  desktopSourceName,
} from '../documents/desktopFileAccess'
import { isTauri } from '../platform/desktop'
import { useTauriOpenFiles } from '../platform/useTauriOpenFiles'
import {
  addRecentDocument,
  clearRecentDocuments,
  loadRecentDocuments,
  updateRecentDocumentMode,
  type RecentDocument,
} from '../documents/recentDocuments'
import { countWords } from '../markdown/wordCount'
import { extractOutline, type OutlineHeading } from '../markdown/outline'
import {
  documentHasFrontmatterMetadata,
  resolveDocumentTitle,
  setFrontmatterTitle,
} from '../markdown/frontmatter'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  appReducer,
  createInitialAppState,
  createTab,
  findTabForLinkedFile,
  getActiveTab,
  MAX_OPEN_TABS,
  tabLabel,
  type AppState,
  type EditorMode,
  type MarkdownDocument,
  type SaveStatus,
  type Theme,
  ensureTabBaseline,
} from './appState'

export type ViewState = AppState & {
  document: MarkdownDocument
  mode: EditorMode
  saveStatus: SaveStatus
}

type AppContextValue = {
  state: ViewState
  setMarkdown: (markdown: string) => void
  setTitle: (title: string) => void
  setMode: (mode: EditorMode) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleZenMode: () => void
  newDocument: () => Promise<string | null>
  switchTab: (tabId: string) => Promise<boolean>
  closeTab: (tabId: string) => Promise<boolean>
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
  documentSessionKey: string
  hasFrontmatterMetadata: boolean
  loadSidebarPrefs: () => DocumentSidebarPrefs | undefined
  saveSidebarPrefs: (prefs: DocumentSidebarPrefs) => void
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

function toViewState(state: AppState): ViewState {
  const active = getActiveTab(state)
  return {
    ...state,
    document: active.document,
    mode: active.mode,
    saveStatus: active.saveStatus,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState)
  const activeTab = getActiveTab(state)
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
  const fileHandlesRef = useRef(new Map<string, FileSystemFileHandle>())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null)
  const pendingDiscardTabIdRef = useRef<string | null>(null)
  const linkedFileFormatRef = useRef<LinkedFileFormat | null>(null)

  const syncActiveLinkedFileUi = useCallback((tabId: string) => {
    const tab = state.tabs.find((entry) => entry.id === tabId)
    if (!tab) return
    const handle = fileHandlesRef.current.get(tabId) ?? null
    const path = tab.linkedPath ?? null
    const sourceName = tab.sourceName
    setHasFileHandle(handle !== null || path !== null)
    setLinkedFileName(sourceName ?? null)
    if ((handle && sourceName) || path) {
      const name = sourceName
      if (name) {
        const format = detectLinkedFileFormat(name)
        linkedFileFormatRef.current = format
        setLinkedFileFormat(format)
        return
      }
    }
    linkedFileFormatRef.current = null
    setLinkedFileFormat(null)
  }, [state.tabs])

  const setTabLinkedFile = useCallback(
    (
      tabId: string,
      handle: FileSystemFileHandle | null,
      sourceName?: string,
      path?: string | null,
    ) => {
      if (handle) {
        fileHandlesRef.current.set(tabId, handle)
      } else {
        fileHandlesRef.current.delete(tabId)
      }
      dispatch({
        type: 'setTabLinkedFile',
        tabId,
        sourceName,
        linkedPath: path ?? null,
      })
      if (tabId === state.activeTabId) {
        setHasFileHandle(handle !== null || (path ?? null) !== null)
        setLinkedFileName(sourceName ?? null)
        if ((handle && sourceName) || path) {
          const name = sourceName
          if (name) {
            const format = detectLinkedFileFormat(name)
            linkedFileFormatRef.current = format
            setLinkedFileFormat(format)
            return
          }
        }
        linkedFileFormatRef.current = null
        setLinkedFileFormat(null)
      }
    },
    [state.activeTabId],
  )

  useEffect(() => {
    syncActiveLinkedFileUi(state.activeTabId)
  }, [state.activeTabId, state.tabs, syncActiveLinkedFileUi])

  const persistDocumentMode = useCallback(
    (mode: EditorMode, title: string, sourceName?: string) => {
      saveDocumentMode(documentModeKey({ sourceName, title }), mode)
      setRecentDocuments(
        updateRecentDocumentMode({ title, sourceName, mode }),
      )
    },
    [],
  )

  const requestDiscardConfirm = useCallback(
    (tabId: string = state.activeTabId): Promise<boolean> => {
      const tab = state.tabs.find((entry) => entry.id === tabId)
      if (!tab?.document.dirty) return Promise.resolve(true)
      pendingDiscardTabIdRef.current = tabId
      return new Promise((resolve) => {
        confirmResolverRef.current = resolve
        setConfirmOpen(true)
      })
    },
    [state.activeTabId, state.tabs],
  )

  const handleConfirmDiscard = useCallback(() => {
    setConfirmOpen(false)
    const tabId = pendingDiscardTabIdRef.current
    if (tabId) {
      dispatch({ type: 'revertTab', tabId })
      pendingDiscardTabIdRef.current = null
    }
    confirmResolverRef.current?.(true)
    confirmResolverRef.current = null
  }, [])

  const handleCancelDiscard = useCallback(() => {
    setConfirmOpen(false)
    pendingDiscardTabIdRef.current = null
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
      documentId?: string,
    ) => {
      setRecentDocuments(
        addRecentDocument({
          title,
          markdown,
          sourceName,
          documentId: sourceName ? undefined : documentId,
          importedFromHtml,
          mode,
        }),
      )
    },
    [],
  )

  const snapshotDraftToRecent = useCallback(
    (
      tabId: string,
      title: string,
      markdown: string,
      mode: EditorMode,
      documentId: string,
    ) => {
      if (!markdown.trim()) return
      const tab = state.tabs.find((entry) => entry.id === tabId)
      if (!tab) return
      if (fileHandlesRef.current.has(tabId) || tab.linkedPath) return
      recordRecent(title, markdown, undefined, undefined, mode, documentId)
    },
    [recordRecent, state.tabs],
  )

  const activateTab = useCallback(
    async (tabId: string, noticeMessage?: string): Promise<string | null> => {
      if (tabId === state.activeTabId) {
        if (noticeMessage) setNotice(noticeMessage)
        return tabId
      }
      if (!(await requestDiscardConfirm(state.activeTabId))) return null
      dispatch({ type: 'switchTab', tabId })
      if (noticeMessage) setNotice(noticeMessage)
      return tabId
    },
    [requestDiscardConfirm, state.activeTabId],
  )

  const openDocumentInNewTab = useCallback(
    (
      title: string,
      markdown: string,
      handle: FileSystemFileHandle | null,
      sourceName?: string,
      importedFromHtml?: boolean,
      preferredMode?: string,
      path?: string | null,
    ): string | null => {
      const existing = findTabForLinkedFile(state.tabs, path, sourceName)
      if (existing) {
        void activateTab(existing.id, `Already open: ${tabLabel(existing)}`)
        return existing.id
      }

      if (state.tabs.length >= MAX_OPEN_TABS) {
        setNotice(
          `Tab limit reached (${MAX_OPEN_TABS}). Close a tab to open another file.`,
        )
        return null
      }

      const fallback =
        preferredMode && EDITOR_MODES.includes(preferredMode as EditorMode)
          ? (preferredMode as EditorMode)
          : 'raw'
      const mode = resolveStoredMode({ sourceName, title }, fallback)
      const resolvedTitle = resolveDocumentTitle(markdown, title)
      const tab = createTab({
        document: {
          title: resolvedTitle,
          markdown,
          dirty: false,
        },
        mode,
        saveStatus: 'saved',
        sourceName,
        linkedPath: path ?? null,
      })
      dispatch({
        type: 'restoreWorkspace',
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      })
      if (handle) {
        fileHandlesRef.current.set(tab.id, handle)
      }
      recordRecent(resolvedTitle, markdown, sourceName, importedFromHtml, mode)
      return tab.id
    },
    [activateTab, recordRecent, state.tabs],
  )

  const loadFileDirectly = useCallback(
    async (file: File): Promise<string | null> => {
      const opened = await readDocumentFile(file)
      openDocumentInNewTab(
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
    [openDocumentInNewTab],
  )

  const loadFromFile = useCallback(
    async (file: File): Promise<string | null> => loadFileDirectly(file),
    [loadFileDirectly],
  )

  const openFileFromInput = useCallback(async () => {
    fileInputRef.current?.click()
  }, [])

  const openFileFromPicker = useCallback(
    (onResult: (message: string | null) => void) => {
      void (async () => {
        if (isTauri()) {
          try {
            const opened = await openDocumentWithDesktopDialog()
            if (!opened) {
              onResult(null)
              return
            }
            openDocumentInNewTab(
              opened.title,
              opened.markdown,
              null,
              opened.sourceName,
              opened.convertedFromHtml,
              undefined,
              opened.path,
            )
            const msg = importNotice(
              opened.title,
              opened.convertedFromHtml,
            )
            setNotice(msg)
            onResult(msg)
          } catch (err) {
            onResult(err instanceof Error ? err.message : 'Open failed')
          }
          return
        }

        if (supportsFileSystemAccess()) {
          try {
            const picked = await openMarkdownWithPicker()
            if (!picked) {
              onResult(null)
              return
            }
            openDocumentInNewTab(
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
    [openDocumentInNewTab],
  )

  const openDocumentFromPaths = useCallback(
    async (paths: string[]) => {
      let lastMsg: string | null = null
      for (const path of paths) {
        try {
          const opened = await openDocumentFromPath(path)
          openDocumentInNewTab(
            opened.title,
            opened.markdown,
            null,
            opened.sourceName,
            opened.convertedFromHtml,
            undefined,
            opened.path,
          )
          lastMsg = importNotice(opened.title, opened.convertedFromHtml)
        } catch (err) {
          setNotice(err instanceof Error ? err.message : 'Open failed')
          return
        }
      }
      if (lastMsg) setNotice(lastMsg)
    },
    [openDocumentInNewTab],
  )

  const restoreDraft = useCallback((draft: NonNullable<ReturnType<typeof loadDraft>>) => {
    const tabs = draft.tabs.map((tab) => {
      const withBaseline = ensureTabBaseline(tab)
      return {
        ...withBaseline,
        document: {
          ...withBaseline.document,
          title: resolveDocumentTitle(
            withBaseline.document.markdown,
            withBaseline.document.title,
          ),
          dirty: false,
        },
        saveStatus: 'saved' as const,
      }
    })
    dispatch({
      type: 'restoreWorkspace',
      tabs,
      activeTabId: draft.activeTabId,
      theme: draft.theme as Theme | undefined,
    })
  }, [])

  const handleTauriBootstrapComplete = useCallback(
    (openedAny: boolean) => {
      if (!openedAny) {
        const draft = loadDraft()
        if (draft?.tabs.length) {
          restoreDraft(draft)
        }
      }
      hydrated.current = true
    },
    [restoreDraft],
  )

  useTauriOpenFiles(openDocumentFromPaths, handleTauriBootstrapComplete)

  const openRecentDocument = useCallback(
    async (id: string): Promise<string | null> => {
      const entry = recentDocuments.find((doc) => doc.id === id)
      if (!entry) return null

      openDocumentInNewTab(
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
    [openDocumentInNewTab, recentDocuments],
  )

  const clearRecent = useCallback(() => {
    clearRecentDocuments()
    setRecentDocuments([])
    setNotice('Recent documents cleared')
  }, [])

  const newDocument = useCallback(async (): Promise<string | null> => {
    if (state.tabs.length >= MAX_OPEN_TABS) {
      setNotice(
        `Tab limit reached (${MAX_OPEN_TABS}). Close a tab before opening another.`,
      )
      return null
    }
    const mode = resolveStoredMode({ title: 'Untitled' }, 'raw')
    dispatch({ type: 'addTab', mode })
    lastSavedSnapshot.current = null
    const msg = 'New document'
    setNotice(msg)
    return msg
  }, [state.tabs.length])

  const switchTab = useCallback(
    async (tabId: string): Promise<boolean> => {
      if (tabId === state.activeTabId) return true
      if (!(await requestDiscardConfirm(state.activeTabId))) return false
      dispatch({ type: 'switchTab', tabId })
      return true
    },
    [requestDiscardConfirm, state.activeTabId],
  )

  const closeTab = useCallback(
    async (tabId: string): Promise<boolean> => {
      const tab = state.tabs.find((entry) => entry.id === tabId)
      if (!tab) return false
      if (!(await requestDiscardConfirm(tabId))) return false

      snapshotDraftToRecent(
        tabId,
        tab.document.title,
        tab.document.markdown,
        tab.mode,
        tab.document.id,
      )
      fileHandlesRef.current.delete(tabId)
      dispatch({ type: 'closeTab', tabId })
      return true
    },
    [requestDiscardConfirm, snapshotDraftToRecent, state.tabs],
  )

  const saveFile = useCallback(async (): Promise<string | null> => {
    const tabId = state.activeTabId
    const tab = getActiveTab(state)
    const handle = fileHandlesRef.current.get(tabId) ?? null
    const path = tab.linkedPath ?? null
    const format = tab.sourceName ? detectLinkedFileFormat(tab.sourceName) : null
    if (!format || (!handle && !path)) {
      return 'Use Save As to choose a file first'
    }

    try {
      if (path && isTauri()) {
        await saveDesktopLinkedFile(
          path,
          tab.document.title,
          tab.document.markdown,
          format,
        )
      } else if (handle) {
        const saved = await saveLinkedFile(
          tab.document.title,
          tab.document.markdown,
          handle,
          format,
        )
        fileHandlesRef.current.set(tabId, saved)
        setHasFileHandle(true)
      } else {
        return 'Use Save As to choose a file first'
      }

      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
        tabId,
      })
      recordRecent(
        tab.document.title,
        tab.document.markdown,
        tab.sourceName,
        undefined,
        tab.mode,
      )
      return format === 'html' ? 'Saved HTML to file' : 'Saved to file'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save failed'
    }
  }, [recordRecent, state])

  const saveFileAs = useCallback(async (): Promise<string | null> => {
    const tabId = state.activeTabId
    const tab = getActiveTab(state)
    try {
      if (isTauri()) {
        const path = await saveMarkdownAsWithDesktopDialog(
          tab.document.title,
          tab.document.markdown,
        )
        if (!path) return null
        const sourceName = await desktopSourceName(path)
        const previousKey = documentModeKey({
          sourceName: tab.sourceName,
          title: tab.document.title,
        })
        setTabLinkedFile(tabId, null, sourceName, path)
        migrateDocumentModeKey(
          previousKey,
          documentModeKey({
            sourceName,
            title: tab.document.title,
          }),
        )
        dispatch({
          type: 'markSaved',
          savedAt: new Date().toISOString(),
          tabId,
        })
        recordRecent(
          tab.document.title,
          tab.document.markdown,
          sourceName,
          undefined,
          tab.mode,
        )
        return 'Saved to file'
      }

      const handle = await saveMarkdownAsWithPicker(
        tab.document.title,
        tab.document.markdown,
      )
      if (handle) {
        const previousKey = documentModeKey({
          sourceName: tab.sourceName,
          title: tab.document.title,
        })
        setTabLinkedFile(tabId, handle, handle.name, null)
        migrateDocumentModeKey(
          previousKey,
          documentModeKey({
            sourceName: handle.name,
            title: tab.document.title,
          }),
        )
      }
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
        tabId,
      })
      recordRecent(
        tab.document.title,
        tab.document.markdown,
        tab.sourceName,
        undefined,
        tab.mode,
      )
      return handle ? 'Saved to file' : 'Downloaded .md'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save failed'
    }
  }, [recordRecent, setTabLinkedFile, state])

  const saveFileAsHtml = useCallback(async (): Promise<string | null> => {
    const tabId = state.activeTabId
    const tab = getActiveTab(state)
    try {
      if (isTauri()) {
        const path = await saveHtmlAsWithDesktopDialog(
          tab.document.title,
          tab.document.markdown,
        )
        if (!path) return null
        const sourceName = await desktopSourceName(path)
        setTabLinkedFile(tabId, null, sourceName, path)
        dispatch({
          type: 'markSaved',
          savedAt: new Date().toISOString(),
          tabId,
        })
        recordRecent(
          tab.document.title,
          tab.document.markdown,
          sourceName,
          undefined,
          tab.mode,
        )
        return 'Saved HTML to file'
      }

      const handle = await saveHtmlAsWithPicker(
        tab.document.title,
        tab.document.markdown,
      )
      if (handle) {
        setTabLinkedFile(tabId, handle, handle.name, null)
      }
      dispatch({
        type: 'markSaved',
        savedAt: new Date().toISOString(),
        tabId,
      })
      recordRecent(
        tab.document.title,
        tab.document.markdown,
        tab.sourceName,
        undefined,
        tab.mode,
      )
      return handle ? 'Saved HTML to file' : 'Downloaded .html'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      return err instanceof Error ? err.message : 'Save HTML failed'
    }
  }, [recordRecent, setTabLinkedFile, state])

  useEffect(() => {
    if (isTauri()) return

    const draft = loadDraft()
    if (draft?.tabs.length) {
      restoreDraft(draft)
    }
    hydrated.current = true
  }, [restoreDraft])

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

    const hasDirty = state.tabs.some((tab) => tab.document.dirty)
    if (hasDirty) {
      dispatch({ type: 'setSaveStatus', saveStatus: 'saving' })
    }

    saveTimer.current = setTimeout(() => {
      const tabs = state.tabs.map((tab) => ({
        ...tab,
        document: { ...tab.document, dirty: false },
        saveStatus: 'saved' as const,
        baseline: {
          title: tab.document.title,
          markdown: tab.document.markdown,
        },
      }))
      saveDraft({
        tabs,
        activeTabId: state.activeTabId,
        theme: state.theme,
      })
      for (const tab of tabs) {
        snapshotDraftToRecent(
          tab.id,
          tab.document.title,
          tab.document.markdown,
          tab.mode,
          tab.document.id,
        )
      }
      dispatch({
        type: 'restoreWorkspace',
        tabs,
        activeTabId: state.activeTabId,
      })
      lastSavedSnapshot.current = snapshot
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [
    snapshotDraftToRecent,
    state,
  ])

  const outline = useMemo(
    () => extractOutline(activeTab.document.markdown),
    [activeTab.document.markdown],
  )
  const wordCount = useMemo(
    () => countWords(activeTab.document.markdown),
    [activeTab.document.markdown],
  )
  const headingCount = outline.length

  const setMode = useCallback(
    (mode: EditorMode) => {
      dispatch({ type: 'setMode', mode })
      persistDocumentMode(mode, activeTab.document.title, activeTab.sourceName)
    },
    [activeTab.document.title, activeTab.sourceName, persistDocumentMode],
  )

  const setTitle = useCallback(
    (title: string) => {
      const previousTitle = activeTab.document.title
      if (title === previousTitle) return
      if (!activeTab.sourceName) {
        migrateDocumentModeKey(
          documentModeKey({ title: previousTitle }),
          documentModeKey({ title }),
        )
      }
      const nextMarkdown = setFrontmatterTitle(activeTab.document.markdown, title)
      if (nextMarkdown !== activeTab.document.markdown) {
        dispatch({ type: 'setMarkdown', markdown: nextMarkdown })
      }
      dispatch({ type: 'setTitle', title })
    },
    [activeTab.document.markdown, activeTab.document.title, activeTab.sourceName],
  )

  const hasFrontmatterMetadata = useMemo(
    () => documentHasFrontmatterMetadata(activeTab.document.markdown),
    [activeTab.document.markdown],
  )

  const loadSidebarPrefs = useCallback(
    () =>
      loadDocumentSidebarPrefs({
        sourceName: activeTab.sourceName,
        title: activeTab.document.title,
      }),
    [activeTab.document.title, activeTab.sourceName],
  )

  const saveSidebarPrefs = useCallback(
    (prefs: DocumentSidebarPrefs) => {
      saveDocumentSidebarPrefs(
        {
          sourceName: activeTab.sourceName,
          title: activeTab.document.title,
        },
        prefs,
      )
    },
    [activeTab.document.title, activeTab.sourceName],
  )

  const viewState = useMemo(() => toViewState(state), [state])

  const value = useMemo<AppContextValue>(
    () => ({
      state: viewState,
      setMarkdown: (markdown) => dispatch({ type: 'setMarkdown', markdown }),
      setTitle,
      setMode,
      setTheme: (theme) => dispatch({ type: 'setTheme', theme }),
      toggleTheme: () => dispatch({ type: 'toggleTheme' }),
      toggleZenMode: () => dispatch({ type: 'toggleZenMode' }),
      newDocument,
      switchTab,
      closeTab,
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
      documentSessionKey: activeTab.id,
      hasFrontmatterMetadata,
      loadSidebarPrefs,
      saveSidebarPrefs,
      recentDocuments,
      outline,
      notice,
      clearNotice: () => setNotice(null),
      showNotice: (message) => setNotice(message),
      wordCount,
      headingCount,
    }),
    [
      viewState,
      setTitle,
      setMode,
      newDocument,
      switchTab,
      closeTab,
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
      activeTab.id,
      hasFrontmatterMetadata,
      loadSidebarPrefs,
      saveSidebarPrefs,
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
