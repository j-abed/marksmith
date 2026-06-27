import type { SaveStatus } from '../app/appState'

export function formatSaveStatusLabel(
  status: SaveStatus,
  linkedToDisk: boolean,
  linkedFileName?: string | null,
): string {
  switch (status) {
    case 'saving':
      return linkedToDisk ? 'Saving…' : 'Saving draft…'
    case 'saved':
      if (linkedToDisk && linkedFileName) {
        return `Saved to ${linkedFileName}`
      }
      return linkedToDisk ? 'Saved' : 'Draft saved'
    case 'unsaved':
      return 'Unsaved'
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
