import type { EditorView } from '@codemirror/view'
import { undo, redo } from '@codemirror/commands'
import type { EditorMode } from './appState'
import {
  copyMarkdownToClipboard,
  copySanitizedHtmlToClipboard,
  pasteTextAtSelection,
  readContentFromClipboard,
} from '../documents/clipboard'

export type AppKeyboardHandlers = {
  zenMode: boolean
  mode: EditorMode
  canSaveToDisk: boolean
  markdown: string
  newDocument: () => Promise<string | null>
  openFileFromInput: () => Promise<void>
  openFind: () => void
  openReplace: () => void
  openShortcutsHelp: () => void
  saveFile: () => Promise<string | null>
  saveFileAs: () => Promise<string | null>
  toggleZenMode: () => void
  setMarkdown: (markdown: string) => void
  notify: (message: string) => void
  getEditorView: () => EditorView | null
}

function isTypingInTitleField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement &&
    target.classList.contains('top-bar__title')
  )
}

function isEditableMode(mode: EditorMode): boolean {
  return mode !== 'preview'
}

function runEditorHistory(
  event: KeyboardEvent,
  handlers: AppKeyboardHandlers,
  direction: 'undo' | 'redo',
): boolean {
  if (isTypingInTitleField(event.target)) return false

  const view = handlers.getEditorView()
  if (!view || !isEditableMode(handlers.mode)) return false

  event.preventDefault()
  if (direction === 'undo') {
    undo(view)
  } else {
    redo(view)
  }
  return true
}

async function runSave(handlers: AppKeyboardHandlers) {
  if (handlers.canSaveToDisk) {
    const msg = await handlers.saveFile()
    if (msg) handlers.notify(msg)
    return
  }
  const msg = await handlers.saveFileAs()
  if (msg) handlers.notify(msg)
}

export function handleAppKeyboardEvent(
  event: KeyboardEvent,
  handlers: AppKeyboardHandlers,
): boolean {
  const key = event.key.toLowerCase()

  if (key === 'escape' && handlers.zenMode) {
    event.preventDefault()
    handlers.toggleZenMode()
    return true
  }

  const mod = event.metaKey || event.ctrlKey
  if (!mod) return false

  if (key === 'z') {
    return runEditorHistory(event, handlers, event.shiftKey ? 'redo' : 'undo')
  }

  if (key === 'y') {
    return runEditorHistory(event, handlers, 'redo')
  }

  if (key === 'n') {
    event.preventDefault()
    void handlers.newDocument().then((msg) => {
      if (msg) handlers.notify(msg)
    })
    return true
  }

  if (key === 'o') {
    event.preventDefault()
    void handlers.openFileFromInput()
    return true
  }

  if (key === 'f') {
    event.preventDefault()
    if (event.altKey) {
      handlers.openReplace()
    } else {
      handlers.openFind()
    }
    return true
  }

  if (key === '/') {
    event.preventDefault()
    handlers.openShortcutsHelp()
    return true
  }

  if (key === 's' && event.shiftKey) {
    event.preventDefault()
    void handlers.saveFileAs().then((msg) => {
      if (msg) handlers.notify(msg)
    })
    return true
  }

  if (key === 's') {
    event.preventDefault()
    void runSave(handlers)
    return true
  }

  if (key === 'e' && event.shiftKey) {
    event.preventDefault()
    handlers.toggleZenMode()
    return true
  }

  if (!event.shiftKey || isTypingInTitleField(event.target)) {
    return false
  }

  if (key === 'c') {
    event.preventDefault()
    void copyMarkdownToClipboard(handlers.markdown).then(() =>
      handlers.notify('Markdown copied'),
    )
    return true
  }

  if (key === 'h') {
    event.preventDefault()
    void copySanitizedHtmlToClipboard(handlers.markdown).then(() =>
      handlers.notify('HTML copied'),
    )
    return true
  }

  if (key === 'v') {
    event.preventDefault()
    void readContentFromClipboard().then(({ text, convertedFromHtml }) => {
      const view = handlers.getEditorView()
      if (view && handlers.mode !== 'preview') {
        const { from, to } = view.state.selection.main
        const result = pasteTextAtSelection(text, handlers.markdown, {
          from,
          to,
        })
        handlers.setMarkdown(result.text)
        view.dispatch({
          changes: {
            from: 0,
            to: handlers.markdown.length,
            insert: result.text,
          },
          selection: {
            anchor: result.selection.from,
            head: result.selection.to,
          },
        })
      } else {
        handlers.setMarkdown(text)
      }
      handlers.notify(
        convertedFromHtml
          ? 'Pasted from clipboard (converted from HTML)'
          : 'Pasted from clipboard',
      )
    })
    return true
  }

  return false
}
