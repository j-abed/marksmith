import { useState } from 'react'
import type { SaveStatus } from '../app/appState'
import { getInstallFooterHint } from '../app/installAppHelp'
import { useInstallPrompt } from '../app/useInstallPrompt'
import { InstallAppDialog } from './InstallAppDialog'
import { BuyMeCoffeeLink } from './BuyMeCoffeeLink'
import { MadeInNyc } from './MadeInNyc'
import { formatSaveStatusLabel } from './saveStatusLabel'

type StatusBarProps = {
  saveStatus: SaveStatus
  linkedToDisk: boolean
  linkedFileName?: string | null
  wordCount: number
  headingCount: number
}

export function StatusBar({
  saveStatus,
  linkedToDisk,
  linkedFileName,
  wordCount,
  headingCount,
}: StatusBarProps) {
  const { showInstallInFooter } = useInstallPrompt()
  const [installOpen, setInstallOpen] = useState(false)
  const saveLabel = formatSaveStatusLabel(
    saveStatus,
    linkedToDisk,
    linkedFileName,
  )

  return (
    <footer className="status-bar">
      <span
        className={`status-bar__save status-bar__save--${saveStatus}`}
        aria-live="polite"
        aria-atomic="true"
        title={
          linkedToDisk
            ? 'Saved to the linked file on disk'
            : 'Saved locally in this app — use Save As for a file on disk'
        }
      >
        {saveLabel}
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
