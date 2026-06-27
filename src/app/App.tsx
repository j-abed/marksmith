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
import { OutlineSidebar } from '../ui/OutlineSidebar'
import { StatusBar } from '../ui/StatusBar'
import { KeyboardShortcutsDialog } from '../ui/KeyboardShortcutsDialog'
import { TopBar } from '../ui/TopBar'
import { ZenExitButton } from '../ui/ZenExitButton'

const OUTLINE_OPEN_KEY = 'marksmith:outline-open'

function loadOutlineOpen(): boolean {
  try {
    return localStorage.getItem(OUTLINE_OPEN_KEY) === '1'
  } catch {
    return false
  }
}

function saveOutlineOpen(open: boolean): void {
  try {
    localStorage.setItem(OUTLINE_OPEN_KEY, open ? '1' : '0')
  } catch {
    // ignore
  }
}

export function App() {
  const {
    state,
    setMarkdown,
    toggleZenMode,
    loadFromFile,
    outline,
    showNotice,
    wordCount,
    headingCount,
  } = useApp()
  const editorRef = useRef<EditorView | null>(null)
  const { mode, document: doc, saveStatus, zenMode } = state
  const [dragOver, setDragOver] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(loadOutlineOpen)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

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
  const showOutline = outlineOpen && !zenMode

  useEffect(() => {
    const preload = () => preloadSecondaryModes()
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(preload)
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(preload, 1200)
    return () => clearTimeout(timer)
  }, [])

  const toggleOutline = useCallback(() => {
    setOutlineOpen((open) => {
      const next = !open
      saveOutlineOpen(next)
      return next
    })
  }, [])

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
          outlineOpen={outlineOpen}
          onToggleOutline={toggleOutline}
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
        {showOutline && (
          <OutlineSidebar
            headings={outline}
            onSelectLine={jumpToHeading}
            onClose={toggleOutline}
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
