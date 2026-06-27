import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { EditorView } from '@codemirror/view'
import { useApp } from '../app/AppProvider'
import { useInstallPrompt } from '../app/useInstallPrompt'
import { InstallAppDialog } from './InstallAppDialog'
import { EditMenu } from './EditMenu'
import { ExportMenu } from './ExportMenu'
import { FileMenu } from './FileMenu'
import { ModeMenu } from './ModeMenu'
import { ThemeToggle } from './ThemeToggle'
import { ViewMenu } from './ViewMenu'

type TopBarProps = {
  editorRef?: RefObject<EditorView | null>
  outlineOpen: boolean
  frontmatterOpen: boolean
  onToggleOutline: () => void
  onToggleFrontmatter: () => void
  onFind: () => void
  onReplace: () => void
  onOpenShortcuts: () => void
}

const homeHref = import.meta.env.BASE_URL === './' ? '../' : '/'
const faviconHref = `${import.meta.env.BASE_URL}favicon.svg`

export function TopBar({
  editorRef,
  outlineOpen,
  frontmatterOpen,
  onToggleOutline,
  onToggleFrontmatter,
  onFind,
  onReplace,
  onOpenShortcuts,
}: TopBarProps) {
  const { state, setTitle, setMode, toggleTheme, toggleZenMode, notice, clearNotice, showNotice } =
    useApp()
  const { canInstall, promptInstall, showInstallInMenu } = useInstallPrompt()
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [installOpen, setInstallOpen] = useState(false)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showFeedback = useCallback((message: string) => {
    setCopyFeedback(message)
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setCopyFeedback(null), 2500)
  }, [])

  const handleInstallApp = useCallback(() => {
    if (canInstall) {
      void promptInstall().then((accepted) => {
        if (accepted) {
          showNotice('Marksmith installed — launch from your dock or home screen')
        }
      })
      return
    }
    if (import.meta.env.PROD) {
      showNotice(
        'Use the install icon in the address bar, or open the browser menu (⋮) → Install Marksmith…',
      )
      return
    }
    setInstallOpen(true)
  }, [canInstall, promptInstall, showNotice])

  useEffect(() => {
    if (notice) {
      showFeedback(notice)
      clearNotice()
    }
  }, [notice, clearNotice, showFeedback])

  return (
    <header className="top-bar">
      <div className="top-bar__start">
        <div className="top-bar__brand">
          <a className="top-bar__logo-link" href={homeHref} title="Back to Marksmith home">
            <img
              className="top-bar__logo-icon"
              src={faviconHref}
              width="22"
              height="22"
              alt=""
            />
            <span className="top-bar__logo">Marksmith</span>
          </a>
        </div>
        <input
          className="top-bar__title"
          value={state.document.title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Document title"
          placeholder="Untitled"
        />
      </div>
      <div className="top-bar__actions">
        <div className="top-bar__group" role="group" aria-label="Document">
          <FileMenu onFeedback={showFeedback} />
          <EditMenu
            editorRef={editorRef}
            onFeedback={showFeedback}
            onFind={onFind}
            onReplace={onReplace}
          />
          <ViewMenu
            outlineOpen={outlineOpen}
            frontmatterOpen={frontmatterOpen}
            onToggleOutline={onToggleOutline}
            onToggleFrontmatter={onToggleFrontmatter}
            onOpenShortcuts={onOpenShortcuts}
            canInstallApp={showInstallInMenu}
            onInstallApp={handleInstallApp}
          />
          <ModeMenu mode={state.mode} onChange={setMode} />
        </div>
        <div className="top-bar__group top-bar__group--end" role="group" aria-label="View">
          <button
            type="button"
            className="top-bar__btn"
            onClick={toggleZenMode}
            aria-label="Enter zen mode"
            title="Zen mode (⌘⇧E)"
          >
            Zen
          </button>
          <ExportMenu
            title={state.document.title}
            markdown={state.document.markdown}
            onExported={showFeedback}
            onError={showFeedback}
          />
          <ThemeToggle theme={state.theme} onToggle={toggleTheme} />
        </div>
      </div>
      {copyFeedback && (
        <span className="top-bar__feedback" role="status" aria-live="polite">
          {copyFeedback}
        </span>
      )}
      <InstallAppDialog open={installOpen} onClose={() => setInstallOpen(false)} />
    </header>
  )
}
