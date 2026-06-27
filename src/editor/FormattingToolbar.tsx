import type { RefObject } from 'react'
import type { EditorView } from '@codemirror/view'
import {
  applyBlockquote,
  applyBold,
  applyCodeBlock,
  applyHeading,
  applyInlineCode,
  applyItalic,
  applyLink,
  applyOrderedList,
  applyUnorderedList,
  type TextRange,
} from './editorCommands'

type FormattingToolbarProps = {
  editorRef: RefObject<EditorView | null>
  onMarkdownChange: (markdown: string) => void
  markdown: string
  showHybridBadge?: boolean
}

function dispatchMarkdown(
  editorRef: RefObject<EditorView | null>,
  onMarkdownChange: (markdown: string) => void,
  transform: (text: string, range: TextRange) => { text: string; range: TextRange },
) {
  const view = editorRef.current
  if (!view) return
  const text = view.state.doc.toString()
  const main = view.state.selection.main
  const range: TextRange = { from: main.from, to: main.to }
  const result = transform(text, range)
  onMarkdownChange(result.text)
  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.text },
    selection: { anchor: result.range.from, head: result.range.to },
  })
  view.focus()
}

const COMMANDS = [
  { id: 'bold', label: 'B', title: 'Bold (⌘B)', action: applyBold },
  { id: 'italic', label: 'I', title: 'Italic (⌘I)', action: applyItalic },
  { id: 'code', label: '`', title: 'Inline code', action: applyInlineCode },
  { id: 'heading', label: 'H', title: 'Heading', action: applyHeading },
  { id: 'ul', label: '•', title: 'Unordered list', action: applyUnorderedList },
  { id: 'ol', label: '1.', title: 'Ordered list', action: applyOrderedList },
  { id: 'quote', label: '❝', title: 'Blockquote', action: applyBlockquote },
  { id: 'link', label: '🔗', title: 'Link (⌘K)', action: applyLink },
  { id: '_codeblock', label: '{ }', title: 'Code block', action: applyCodeBlock },
] as const

export function FormattingToolbar({
  editorRef,
  onMarkdownChange,
  markdown,
  showHybridBadge = false,
}: FormattingToolbarProps) {
  const canFormat =
    editorRef.current !== null || markdown.length >= 0

  return (
    <div className="formatting-toolbar" role="toolbar" aria-label="Formatting">
      {showHybridBadge && (
        <span className="formatting-toolbar__badge">Hybrid (prototype)</span>
      )}
      {COMMANDS.map((cmd) => (
        <button
          key={cmd.id}
          type="button"
          className="formatting-toolbar__btn"
          title={cmd.title}
          aria-label={cmd.title}
          disabled={!canFormat}
          onClick={() =>
            dispatchMarkdown(editorRef, onMarkdownChange, cmd.action)
          }
        >
          {cmd.label}
        </button>
      ))}
    </div>
  )
}
