import { useMemo, type RefObject } from 'react'
import type { EditorView } from '@codemirror/view'
import { undo, redo } from '@codemirror/commands'
import { useApp } from '../app/AppProvider'
import {
  ClipboardError,
  copyMarkdownToClipboard,
  copySanitizedHtmlToClipboard,
  pasteTextAtSelection,
  readContentFromClipboard,
} from '../documents/clipboard'
import { TopBarMenu, type TopBarMenuEntry } from './TopBarMenu'

type EditMenuProps = {
  editorRef?: RefObject<EditorView | null>
  onFeedback: (message: string) => void
  onFind: () => void
  onReplace: () => void
}

export function EditMenu({ editorRef, onFeedback, onFind, onReplace }: EditMenuProps) {
  const { state, setMarkdown } = useApp()

  const items = useMemo<TopBarMenuEntry[]>(
    () => [
      {
        id: 'undo',
        label: 'Undo',
        description: 'Revert the last edit',
        shortcut: '⌘Z',
        onSelect: () => {
          const view = editorRef?.current
          if (view && state.mode !== 'preview') {
            undo(view)
            view.focus()
          } else {
            onFeedback('Switch to an editable mode to undo')
          }
        },
      },
      {
        id: 'redo',
        label: 'Redo',
        description: 'Restore the last undone edit',
        shortcut: '⌘⇧Z',
        onSelect: () => {
          const view = editorRef?.current
          if (view && state.mode !== 'preview') {
            redo(view)
            view.focus()
          } else {
            onFeedback('Switch to an editable mode to redo')
          }
        },
      },
      { type: 'separator', id: 'edit-sep-history' },
      {
        id: 'find',
        label: 'Find…',
        description: 'Search in the document',
        shortcut: '⌘F',
        onSelect: onFind,
      },
      {
        id: 'replace',
        label: 'Replace…',
        description: 'Find and replace in the document',
        shortcut: '⌘⌥F',
        onSelect: onReplace,
      },
      {
        id: 'copy-md',
        label: 'Copy Markdown',
        description: 'Copy source to clipboard',
        shortcut: '⌘⇧C',
        onSelect: () => {
          void copyMarkdownToClipboard(state.document.markdown)
            .then(() => onFeedback('Markdown copied'))
            .catch((err) => {
              onFeedback(
                err instanceof ClipboardError
                  ? err.message
                  : 'Copy failed. Check clipboard permissions.',
              )
            })
        },
      },
      {
        id: 'copy-html',
        label: 'Copy HTML',
        description: 'Copy sanitized preview HTML',
        shortcut: '⌘⇧H',
        onSelect: () => {
          void copySanitizedHtmlToClipboard(state.document.markdown)
            .then(() => onFeedback('HTML copied'))
            .catch((err) => {
              onFeedback(
                err instanceof ClipboardError
                  ? err.message
                  : 'Copy HTML failed. Check clipboard permissions.',
              )
            })
        },
      },
      {
        id: 'paste',
        label: 'Paste',
        description: 'Insert clipboard text',
        shortcut: '⌘⇧V',
        onSelect: () => {
          void readContentFromClipboard()
            .then(({ text, convertedFromHtml }) => {
              const view = editorRef?.current

              if (view && state.mode !== 'preview') {
                const { from, to } = view.state.selection.main
                const result = pasteTextAtSelection(
                  text,
                  state.document.markdown,
                  { from, to },
                )
                setMarkdown(result.text)
                view.dispatch({
                  changes: {
                    from: 0,
                    to: state.document.markdown.length,
                    insert: result.text,
                  },
                  selection: {
                    anchor: result.selection.from,
                    head: result.selection.to,
                  },
                })
                view.focus()
              } else {
                setMarkdown(text)
              }

              onFeedback(
                convertedFromHtml
                  ? 'Pasted from clipboard (converted from HTML)'
                  : 'Pasted from clipboard',
              )
            })
            .catch((err) => {
              onFeedback(
                err instanceof ClipboardError
                  ? err.message
                  : 'Paste failed. Check clipboard permissions.',
              )
            })
        },
      },
    ],
    [editorRef, onFeedback, onFind, onReplace, setMarkdown, state.document.markdown, state.mode],
  )

  return <TopBarMenu label="Edit" items={items} />
}
