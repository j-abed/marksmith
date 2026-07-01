import { describe, expect, it } from 'vitest'
import {
  appReducer,
  createDocument,
  createTab,
  findTabForLinkedFile,
  getActiveTab,
  nextActiveTabId,
  tabLabel,
  type AppState,
} from '../app/appState'

function stateWithTabs(tabs: ReturnType<typeof createTab>[], activeIndex = 0): AppState {
  return {
    tabs,
    activeTabId: tabs[activeIndex]!.id,
    theme: 'light',
    zenMode: false,
  }
}

function makeBaseState(): AppState {
  const tab = createTab({ document: createDocument({ markdown: '# Hello' }) })
  return { tabs: [tab], activeTabId: tab.id, theme: 'light', zenMode: false }
}

describe('document tabs', () => {
  it('labels tabs from filename or title', () => {
    expect(tabLabel(createTab({ sourceName: 'notes.md' }))).toBe('notes.md')
    expect(
      tabLabel(createTab({ document: { title: 'My Doc', markdown: '# Hi' } })),
    ).toBe('My Doc')
    expect(tabLabel(createTab({ document: { title: '  ', markdown: '' } }))).toBe(
      'Untitled',
    )
  })

  it('adds a new tab and activates it', () => {
    const initial = makeBaseState()
    const next = appReducer(initial, { type: 'addTab', mode: 'split' })
    expect(next.tabs).toHaveLength(2)
    expect(next.activeTabId).toBe(next.tabs[1]!.id)
    expect(getActiveTab(next).mode).toBe('split')
    expect(getActiveTab(next).document.markdown).toBe('')
  })

  it('opens a document in a new tab', () => {
    const initial = makeBaseState()
    const next = appReducer(initial, {
      type: 'openInNewTab',
      title: 'Imported',
      markdown: '# From file',
      mode: 'compare',
      sourceName: 'import.md',
    })
    expect(next.tabs).toHaveLength(2)
    const opened = getActiveTab(next)
    expect(opened.document.title).toBe('Imported')
    expect(opened.document.markdown).toBe('# From file')
    expect(opened.document.dirty).toBe(false)
    expect(opened.mode).toBe('compare')
    expect(opened.sourceName).toBe('import.md')
  })

  it('switches active tab', () => {
    const first = createTab({ document: { title: 'A', markdown: 'a' } })
    const second = createTab({ document: { title: 'B', markdown: 'b' } })
    const state = stateWithTabs([first, second], 0)
    const next = appReducer(state, { type: 'switchTab', tabId: second.id })
    expect(next.activeTabId).toBe(second.id)
    expect(getActiveTab(next).document.title).toBe('B')
  })

  it('closes a tab and selects a neighbor', () => {
    const tabs = [
      createTab({ document: { title: 'A', markdown: 'a' } }),
      createTab({ document: { title: 'B', markdown: 'b' } }),
      createTab({ document: { title: 'C', markdown: 'c' } }),
    ]
    const state = stateWithTabs(tabs, 1)
    const next = appReducer(state, { type: 'closeTab', tabId: tabs[1]!.id })
    expect(next.tabs).toHaveLength(2)
    expect(next.activeTabId).toBe(tabs[2]!.id)
  })

  it('replaces the last tab when closing the only tab', () => {
    const tab = createTab({ document: { title: 'Only', markdown: '# x' } })
    const state = stateWithTabs([tab])
    const next = appReducer(state, { type: 'closeTab', tabId: tab.id })
    expect(next.tabs).toHaveLength(1)
    expect(next.tabs[0]!.id).not.toBe(tab.id)
    expect(getActiveTab(next).document.markdown).toBe('')
  })

  it('tracks dirty state per tab', () => {
    const first = createTab({ document: { title: 'A', markdown: 'a' } })
    const second = createTab({ document: { title: 'B', markdown: 'b' } })
    let state = stateWithTabs([first, second], 0)
    state = appReducer(state, { type: 'setMarkdown', markdown: 'changed' })
    expect(getActiveTab(state).document.dirty).toBe(true)
    expect(state.tabs[1]!.document.dirty).toBe(false)

    state = appReducer(state, { type: 'switchTab', tabId: second.id })
    expect(getActiveTab(state).document.dirty).toBe(false)
  })

  it('preserves mode per tab when switching', () => {
    const first = createTab({ document: { title: 'A', markdown: 'a' }, mode: 'raw' })
    const second = createTab({
      document: { title: 'B', markdown: 'b' },
      mode: 'compare',
    })
    let state = stateWithTabs([first, second], 0)
    state = appReducer(state, { type: 'switchTab', tabId: second.id })
    expect(getActiveTab(state).mode).toBe('compare')
    state = appReducer(state, { type: 'setMode', mode: 'split' })
    state = appReducer(state, { type: 'switchTab', tabId: first.id })
    expect(getActiveTab(state).mode).toBe('raw')
    state = appReducer(state, { type: 'switchTab', tabId: second.id })
    expect(getActiveTab(state).mode).toBe('split')
  })

  it('picks the next tab id when closing', () => {
    const tabs = [
      createTab(),
      createTab(),
      createTab(),
    ]
    expect(nextActiveTabId(tabs, tabs[1]!.id)).toBe(tabs[2]!.id)
    expect(nextActiveTabId(tabs, tabs[2]!.id)).toBe(tabs[1]!.id)
  })

  it('finds an open tab by linked path or filename', () => {
    const tabs = [
      createTab({ sourceName: 'a.md', linkedPath: '/docs/a.md' }),
      createTab({ sourceName: 'b.md' }),
    ]
    expect(findTabForLinkedFile(tabs, '/docs/a.md')?.sourceName).toBe('a.md')
    expect(findTabForLinkedFile(tabs, null, 'b.md')?.sourceName).toBe('b.md')
    expect(findTabForLinkedFile(tabs, '/other.md', 'c.md')).toBeUndefined()
  })

  it('reverts a dirty tab to its baseline', () => {
    const tab = createTab({ document: { title: 'A', markdown: 'original' } })
    let state = stateWithTabs([tab])
    state = appReducer(state, { type: 'setMarkdown', markdown: 'edited' })
    expect(getActiveTab(state).document.dirty).toBe(true)
    state = appReducer(state, { type: 'revertTab', tabId: tab.id })
    expect(getActiveTab(state).document.markdown).toBe('original')
    expect(getActiveTab(state).document.dirty).toBe(false)
  })

  it('updates baseline when marked saved', () => {
    const tab = createTab({ document: { title: 'A', markdown: 'v1' } })
    let state = stateWithTabs([tab])
    state = appReducer(state, { type: 'setMarkdown', markdown: 'v2' })
    state = appReducer(state, {
      type: 'markSaved',
      savedAt: new Date().toISOString(),
      tabId: tab.id,
    })
    state = appReducer(state, { type: 'setMarkdown', markdown: 'v3' })
    state = appReducer(state, { type: 'revertTab', tabId: tab.id })
    expect(getActiveTab(state).document.markdown).toBe('v2')
  })
})

describe('appReducer zen and load', () => {
  const baseState = makeBaseState()

  it('toggles zen mode', () => {
    const next = appReducer(baseState, { type: 'toggleZenMode' })
    expect(next.zenMode).toBe(true)
    const back = appReducer(next, { type: 'toggleZenMode' })
    expect(back.zenMode).toBe(false)
  })

  it('marks active tab dirty on edit', () => {
    const dirty = appReducer(baseState, {
      type: 'setMarkdown',
      markdown: '# Changed',
    })
    expect(getActiveTab(dirty).document.dirty).toBe(true)
    expect(getActiveTab(dirty).saveStatus).toBe('unsaved')
  })

  it('creates a blank tab via addTab', () => {
    const dirty = appReducer(baseState, {
      type: 'setMarkdown',
      markdown: '# Changed',
    })
    const next = appReducer(dirty, { type: 'addTab' })
    expect(getActiveTab(next).document.title).toBe('Untitled')
    expect(getActiveTab(next).document.markdown).toBe('')
    expect(getActiveTab(next).document.dirty).toBe(false)
    expect(dirty.tabs[0]!.document.dirty).toBe(true)
  })
})
