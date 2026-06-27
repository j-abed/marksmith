import { describe, expect, it } from 'vitest'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { history, historyKeymap, undo } from '@codemirror/commands'
import { createAppKeymapExtension } from '../editor/appKeymap'
import type { AppKeyboardHandlers } from '../app/keyboardShortcuts'

describe('editor undo', () => {
  it('supports undo through the app keymap binding', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)

    const handlers: AppKeyboardHandlers = {
      zenMode: false,
      mode: 'raw',
      canSaveToDisk: false,
      markdown: 'hello',
      newDocument: async () => null,
      openFileFromInput: async () => {},
      openFind: () => {},
      openReplace: () => {},
      openShortcutsHelp: () => {},
      saveFile: async () => null,
      saveFileAs: async () => null,
      toggleZenMode: () => {},
      setMarkdown: () => {},
      notify: () => {},
      getEditorView: () => view,
    }

    const view = new EditorView({
      state: EditorState.create({
        doc: 'hello',
        extensions: [
          history(),
          keymap.of(historyKeymap),
          createAppKeymapExtension(() => handlers),
        ],
      }),
      parent,
    })

    view.dispatch({
      changes: { from: 5, insert: ' world' },
    })
    expect(view.state.doc.toString()).toBe('hello world')

    undo(view)
    expect(view.state.doc.toString()).toBe('hello')

    view.destroy()
    parent.remove()
  })
})
