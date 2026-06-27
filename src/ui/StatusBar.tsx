import type { SaveStatus } from '../app/appState'
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
      <MadeInNyc className="status-bar__credit" />
    </footer>
  )
}
