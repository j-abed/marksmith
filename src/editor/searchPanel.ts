import type { EditorView } from '@codemirror/view'
import { openSearchPanel } from '@codemirror/search'

export function openReplacePanel(view: EditorView): boolean {
  openSearchPanel(view)

  requestAnimationFrame(() => {
    const replaceInput = view.dom.querySelector<HTMLInputElement>(
      '.cm-panel.cm-search input[name="replace"]',
    )
    replaceInput?.focus()
    replaceInput?.select()
  })

  return true
}

export function openFindPanel(view: EditorView): boolean {
  openSearchPanel(view)

  requestAnimationFrame(() => {
    const findInput = view.dom.querySelector<HTMLInputElement>(
      '.cm-panel.cm-search input[name="search"]',
    )
    findInput?.focus()
    findInput?.select()
  })

  return true
}
