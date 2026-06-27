import { describe, expect, it } from 'vitest'
import {
  appReducer,
  createDocument,
  type AppState,
} from '../app/appState'

const baseState: AppState = {
  document: createDocument({ markdown: '# Hello' }),
  mode: 'raw',
  theme: 'light',
  saveStatus: 'saved',
  zenMode: false,
}

describe('appReducer zen and load', () => {
  it('toggles zen mode', () => {
    const next = appReducer(baseState, { type: 'toggleZenMode' })
    expect(next.zenMode).toBe(true)
    const back = appReducer(next, { type: 'toggleZenMode' })
    expect(back.zenMode).toBe(false)
  })

  it('loads a document and clears dirty state', () => {
    const dirty = appReducer(baseState, {
      type: 'setMarkdown',
      markdown: '# Changed',
    })
    expect(dirty.document.dirty).toBe(true)

    const loaded = appReducer(dirty, {
      type: 'loadDocument',
      title: 'Imported',
      markdown: '# From file',
    })
    expect(loaded.document.title).toBe('Imported')
    expect(loaded.document.markdown).toBe('# From file')
    expect(loaded.document.dirty).toBe(false)
    expect(loaded.saveStatus).toBe('saved')
  })

  it('creates a blank document', () => {
    const dirty = appReducer(baseState, {
      type: 'setMarkdown',
      markdown: '# Changed',
    })
    const next = appReducer(dirty, { type: 'newDocument' })
    expect(next.document.title).toBe('Untitled')
    expect(next.document.markdown).toBe('')
    expect(next.document.dirty).toBe(false)
    expect(next.saveStatus).toBe('saved')
  })
})
