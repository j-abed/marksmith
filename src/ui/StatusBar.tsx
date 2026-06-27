import { useState } from 'react'
import type { SaveStatus } from '../app/appState'
import { getInstallFooterHint } from '../app/installAppHelp'
import { useInstallPrompt } from '../app/useInstallPrompt'
import { InstallAppDialog } from './InstallAppDialog'
import { BuyMeCoffeeLink } from './BuyMeCoffeeLink'
import { MadeInNyc } from './MadeInNyc'

type StatusBarProps = {
  saveStatus: SaveStatus
  wordCount: number
  headingCount: number
}

function saveLabel(status: SaveStatus): string {
  switch (status) {
    case 'saved':
      return 'Saved'
    case 'saving':
      return 'Saving…'
    case 'unsaved':
      return 'Unsaved'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export function StatusBar({
  saveStatus,
  wordCount,
  headingCount,
}: StatusBarProps) {
  const { showInstallInFooter } = useInstallPrompt()
  const [installOpen, setInstallOpen] = useState(false)

  return (
    <footer className="status-bar">
      <span
        className={`status-bar__save status-bar__save--${saveStatus}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {saveLabel(saveStatus)}
      </span>
      <span className="status-bar__stat">{wordCount} words</span>
      <span className="status-bar__stat">{headingCount} headings</span>
      <div className="status-bar__end">
        {showInstallInFooter && (
          <button
            type="button"
            className="status-bar__install"
            onClick={() => setInstallOpen(true)}
            title="How to install Marksmith as an app"
          >
            {getInstallFooterHint(import.meta.env.PROD)}
          </button>
        )}
        <BuyMeCoffeeLink className="status-bar__support" />
        <MadeInNyc className="status-bar__credit" />
      </div>
      <InstallAppDialog open={installOpen} onClose={() => setInstallOpen(false)} />
    </footer>
  )
}
