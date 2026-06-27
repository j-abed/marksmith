import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { openFindPanel, openReplacePanel } from '../editor/searchPanel'
import { useApp } from './AppProvider'
import { useAppKeyboardShortcuts } from './useAppKeyboardShortcuts'
import { isSupportedDocumentFile } from '../documents/fileAccess'
import { createAppKeymapExtension } from '../editor/appKeymap'
import { EditorModePanel } from '../editor/EditorModePanel'
import { preloadSecondaryModes } from '../editor/modePreload'
import { scrollEditorToLine } from '../editor/scrollSync'
import { FormattingToolbar } from '../editor/FormattingToolbar'
import { DocumentSidebar, type DocumentSidebarTab } from '../ui/DocumentSidebar'
import { applyFrontmatter, type FrontmatterFields } from '../markdown/frontmatter'
import { StatusBar } from '../ui/StatusBar'
import { KeyboardShortcutsDialog } from '../ui/KeyboardShortcutsDialog'
import { TopBar } from '../ui/TopBar'
import { ZenExitButton } from '../ui/ZenExitButton'

const OUTLINE_OPEN_KEY = 'marksmith:outline-open'
const SIDEBAR_TAB_KEY = 'marksmith:sidebar-tab'

function loadSidebarOpen(): boolean {
  try {
    return localStorage.getItem(OUTLINE_OPEN_KEY) === '1'
  } catch {
    return false
  }
}

function saveSidebarOpen(open: boolean): void {
  try {
    localStorage.setItem(OUTLINE_OPEN_KEY, open ? '1' : '0')
  } catch {
    // ignore
  }
}

function loadSidebarTab(): DocumentSidebarTab {
  try {
    return localStorage.getItem(SIDEBAR_TAB_KEY) === 'frontmatter'
      ? 'frontmatter'
      : 'outline'
  } catch {
    return 'outline'
  }
}

function saveSidebarTab(tab: DocumentSidebarTab): void {
  try {
    localStorage.setItem(SIDEBAR_TAB_KEY, tab)
  } catch {
    // ignore
  }
}

export function App() {
  const {
    state,
    setMarkdown,
    setTitle,
    toggleZenMode,
    loadFromFile,
    outline,
    showNotice,
    wordCount,
    headingCount,
    documentSessionKey,
    hasFrontmatterMetadata,
    loadSidebarPrefs,
    saveSidebarPrefs,
  } = useApp()
  const editorRef = useRef<EditorView | null>(null)
  const { mode, document: doc, saveStatus, zenMode } = state
  const [dragOver, setDragOver] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(loadSidebarOpen)
  const [sidebarTab, setSidebarTab] = useState<DocumentSidebarTab>(loadSidebarTab)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const lastSessionKey = useRef<string | null>(null)

  useEffect(() => {
    if (lastSessionKey.current === documentSessionKey) return
    lastSessionKey.current = documentSessionKey

    const saved = loadSidebarPrefs()
    if (saved) {
      setSidebarOpen(saved.open)
      setSidebarTab(saved.tab)
      return
    }
    if (hasFrontmatterMetadata) {
      setSidebarOpen(true)
      setSidebarTab('frontmatter')
      return
    }
    setSidebarOpen(loadSidebarOpen())
    setSidebarTab(loadSidebarTab())
  }, [documentSessionKey, hasFrontmatterMetadata, loadSidebarPrefs])

  useEffect(() => {
    saveSidebarPrefs({ open: sidebarOpen, tab: sidebarTab })
    saveSidebarOpen(sidebarOpen)
    saveSidebarTab(sidebarTab)
  }, [sidebarOpen, sidebarTab, saveSidebarPrefs])

  const openFind = useCallback(() => {
    const view = editorRef.current
    if (!view) {
      showNotice('Switch to an editable mode to search')
      return
    }
    openFindPanel(view)
    view.focus()
  }, [showNotice])

  const openReplace = useCallback(() => {
    const view = editorRef.current
    if (!view) {
      showNotice('Switch to an editable mode to replace')
      return
    }
    openReplacePanel(view)
    view.focus()
  }, [showNotice])

  const openShortcutsHelp = useCallback(() => {
    setShortcutsOpen(true)
  }, [])

  const keyboardHandlersRef = useAppKeyboardShortcuts(
    editorRef,
    openFind,
    openReplace,
    openShortcutsHelp,
  )

  const appKeymap = useMemo(
    () => createAppKeymapExtension(() => keyboardHandlersRef.current),
    [keyboardHandlersRef],
  )

  const showFormatting = !zenMode && (mode === 'raw' || mode === 'hybrid')
  const showSidebar = sidebarOpen && !zenMode

  useEffect(() => {
    const preload = () => preloadSecondaryModes()
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(preload)
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(preload, 1200)
    return () => clearTimeout(timer)
  }, [])

  const openSidebar = useCallback((tab: DocumentSidebarTab) => {
    setSidebarTab(tab)
    setSidebarOpen(true)
  }, [])

  const toggleOutline = useCallback(() => {
    if (sidebarOpen && sidebarTab === 'outline') {
      setSidebarOpen(false)
      return
    }
    openSidebar('outline')
  }, [openSidebar, sidebarOpen, sidebarTab])

  const toggleFrontmatter = useCallback(() => {
    if (sidebarOpen && sidebarTab === 'frontmatter') {
      setSidebarOpen(false)
      return
    }
    openSidebar('frontmatter')
  }, [openSidebar, sidebarOpen, sidebarTab])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleFrontmatterApply = useCallback(
    (fields: FrontmatterFields) => {
      const nextMarkdown = applyFrontmatter(doc.markdown, fields)
      setMarkdown(nextMarkdown)
      if (fields.title?.trim()) {
        setTitle(fields.title.trim())
      }
    },
    [doc.markdown, setMarkdown, setTitle],
  )

  const jumpToHeading = useCallback(
    (line: number) => {
      if (mode === 'html') {
        showNotice('Switch to Raw or Compare to jump to headings')
        return
      }

      const view = editorRef.current
      if (view && mode !== 'preview') {
        scrollEditorToLine(view, line)
        const docLine = view.state.doc.line(Math.min(line, view.state.doc.lines))
        view.dispatch({ selection: { anchor: docLine.from } })
        view.focus()
        return
      }

      const preview = document.querySelector('[data-testid="preview-pane"]')
      const target = preview?.querySelector<HTMLElement>(`[id*="src-line-${line}"]`)
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    },
    [mode, showNotice],
  )

  const handleDropFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      const file = list.find(isSupportedDocumentFile)
      if (!file) return
      await loadFromFile(file)
    },
    [loadFromFile],
  )

  return (
    <div
      className={`app-shell${zenMode ? ' app-shell--zen' : ''}${dragOver ? ' app-shell--drag-over' : ''}`}
      onDragEnter={(event) => {
        if (event.dataTransfer?.types.includes('Files')) {
          event.preventDefault()
          setDragOver(true)
        }
      }}
      onDragOver={(event) => {
        if (event.dataTransfer?.types.includes('Files')) {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
          setDragOver(true)
        }
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) {
          setDragOver(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragOver(false)
        if (event.dataTransfer?.files?.length) {
          void handleDropFiles(event.dataTransfer.files)
        }
      }}
    >
      {!zenMode && (
        <TopBar
          editorRef={editorRef}
          outlineOpen={sidebarOpen && sidebarTab === 'outline'}
          frontmatterOpen={sidebarOpen && sidebarTab === 'frontmatter'}
          onToggleOutline={toggleOutline}
          onToggleFrontmatter={toggleFrontmatter}
          onFind={openFind}
          onReplace={openReplace}
          onOpenShortcuts={openShortcutsHelp}
        />
      )}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
      {showFormatting && (
        <FormattingToolbar
          editorRef={editorRef}
          onMarkdownChange={setMarkdown}
          markdown={doc.markdown}
          showHybridBadge={mode === 'hybrid'}
        />
      )}
      <div className="app-body">
        {showSidebar && (
          <DocumentSidebar
            tab={sidebarTab}
            onTabChange={openSidebar}
            onClose={closeSidebar}
            headings={outline}
            markdown={doc.markdown}
            onSelectLine={jumpToHeading}
            onFrontmatterApply={handleFrontmatterApply}
            hasFrontmatterMetadata={hasFrontmatterMetadata}
          />
        )}
        <main className="app-main" id="editor-panel" role="tabpanel">
          <EditorModePanel
            mode={mode}
            markdown={doc.markdown}
            onChange={setMarkdown}
            editorRef={editorRef}
            appKeymap={appKeymap}
          />
        </main>
      </div>
      {!zenMode && (
        <StatusBar
          saveStatus={saveStatus}
          wordCount={wordCount}
          headingCount={headingCount}
        />
      )}
      {zenMode && <ZenExitButton onExit={toggleZenMode} />}
      {dragOver && (
        <div className="drop-overlay" aria-hidden="true">
          Drop a Markdown file to open
        </div>
      )}
    </div>
  )
}
