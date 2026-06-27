import { useMemo } from 'react'
import { useApp } from '../app/AppProvider'
import { formatRecentDescription, formatRecentLabel } from '../documents/recentDocuments'
import { TopBarMenu, type TopBarMenuEntry } from './TopBarMenu'

type FileMenuProps = {
  onFeedback: (message: string) => void
}

function formatRecentTime(openedAt: string): string {
  const date = new Date(openedAt)
  if (Number.isNaN(date.getTime())) return 'Recently opened'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function FileMenu({ onFeedback }: FileMenuProps) {
  const {
    newDocument,
    openFileFromPicker,
    openRecentDocument,
    clearRecent,
    saveFile,
    saveFileAs,
    saveFileAsHtml,
    canSaveToDisk,
    recentDocuments,
  } = useApp()

  const items = useMemo<TopBarMenuEntry[]>(() => {
    const entries: TopBarMenuEntry[] = [
      {
        id: 'new',
        label: 'New document',
        description: 'Start a blank document',
        shortcut: '⌘N',
        onSelect: () => {
          void newDocument().then((msg) => {
            if (msg) onFeedback(msg)
          })
        },
      },
      {
        id: 'open',
        label: 'Open…',
        description: 'Open Markdown, text, or HTML files',
        shortcut: '⌘O',
        onSelect: () => {
          openFileFromPicker((msg) => {
            if (msg) onFeedback(msg)
          })
        },
      },
    ]

    if (recentDocuments.length > 0) {
      entries.push({ type: 'separator', id: 'recent-separator' })
      for (const recent of recentDocuments.slice(0, 8)) {
        entries.push({
          id: `recent-${recent.id}`,
          label: formatRecentLabel(recent),
          description: formatRecentDescription(recent, formatRecentTime(recent.openedAt)),
          onSelect: () => {
            void openRecentDocument(recent.id).then((msg) => {
              if (msg) onFeedback(msg)
            })
          },
        })
      }
      entries.push({
        id: 'clear-recent',
        label: 'Clear recent',
        description: 'Remove recent document list',
        onSelect: () => {
          clearRecent()
          onFeedback('Recent documents cleared')
        },
      })
    }

    entries.push({ type: 'separator', id: 'save-separator' })
    entries.push(
      {
        id: 'save',
        label: 'Save',
        description: canSaveToDisk
          ? 'Update the linked file'
          : 'Opens Save As when no file is linked',
        shortcut: '⌘S',
        disabled: !canSaveToDisk,
        onSelect: () => {
          void saveFile().then((msg) => {
            if (msg) onFeedback(msg)
          })
        },
      },
      {
        id: 'save-as',
        label: 'Save As…',
        description: 'Save canonical Markdown (.md)',
        shortcut: '⌘⇧S',
        onSelect: () => {
          void saveFileAs().then((msg) => {
            if (msg) onFeedback(msg)
          })
        },
      },
      {
        id: 'save-as-html',
        label: 'Save As HTML…',
        description: 'Export a standalone HTML page',
        onSelect: () => {
          void saveFileAsHtml().then((msg) => {
            if (msg) onFeedback(msg)
          })
        },
      },
    )

    return entries
  }, [
    canSaveToDisk,
    clearRecent,
    newDocument,
    onFeedback,
    openFileFromPicker,
    openRecentDocument,
    recentDocuments,
    saveFile,
    saveFileAs,
    saveFileAsHtml,
  ])

  return <TopBarMenu label="File" items={items} />
}
