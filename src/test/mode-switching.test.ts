import { describe, expect, it } from 'vitest'
import {
  appReducer,
  createDocument,
  createTab,
  getActiveTab,
  type AppState,
  type EditorMode,
} from '../app/appState'

const baseState: AppState = {
  tabs: [
    createTab({
      document: createDocument({ markdown: '# Hello\n\n**world**' }),
    }),
  ],
  activeTabId: '',
  theme: 'light',
  zenMode: false,
}
baseState.activeTabId = baseState.tabs[0]!.id

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
      expect(getActiveTab(state).document.markdown).toBe('# Hello\n\n**world**')
    }
  })

  it('does not alter markdown on title change only', () => {
    const state = appReducer(baseState, {
      type: 'setTitle',
      title: 'New Title',
    })
    expect(getActiveTab(state).document.markdown).toBe('# Hello\n\n**world**')
    expect(getActiveTab(state).document.title).toBe('New Title')
  })
})
