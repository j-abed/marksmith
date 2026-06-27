import { describe, expect, it } from 'vitest'
import {
  appReducer,
  createDocument,
  type AppState,
  type EditorMode,
} from '../app/appState'

const baseState: AppState = {
  document: createDocument({ markdown: '# Hello\n\n**world**' }),
  mode: 'raw',
  theme: 'light',
  saveStatus: 'saved',
  zenMode: false,
}

describe('mode switching', () => {
  it('preserves markdown when switching modes', () => {
    const modes: EditorMode[] = [
      'raw',
      'preview',
      'split',
      'hybrid',
      'html',
      'compare',
    ]
    let state = baseState

    for (const mode of modes) {
      state = appReducer(state, { type: 'setMode', mode })
      expect(state.document.markdown).toBe('# Hello\n\n**world**')
    }
  })

  it('does not alter markdown on title change only', () => {
    const state = appReducer(baseState, {
      type: 'setTitle',
      title: 'New Title',
    })
    expect(state.document.markdown).toBe('# Hello\n\n**world**')
    expect(state.document.title).toBe('New Title')
  })
})
