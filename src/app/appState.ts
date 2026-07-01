export type EditorMode = 'raw' | 'preview' | 'split' | 'hybrid' | 'html' | 'compare'

export type Theme = 'light' | 'dark'

export function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem('marksmith:theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export type MarkdownDocument = {
  id: string
  title: string
  markdown: string
  dirty: boolean
  lastSavedAt?: string
  updatedAt: string
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved'

export type TabBaseline = {
  title: string
  markdown: string
}

export const MAX_OPEN_TABS = 20

export type DocumentTab = {
  id: string
  document: MarkdownDocument
  mode: EditorMode
  saveStatus: SaveStatus
  sourceName?: string
  linkedPath?: string | null
  baseline: TabBaseline
}

export type AppState = {
  tabs: DocumentTab[]
  activeTabId: string
  theme: Theme
  zenMode: boolean
}

export const DEFAULT_MARKDOWN = `# Welcome to Marksmith

Start writing in **Raw** mode, preview in **Preview**, or edit side-by-side in **Split**.

## Features

- GitHub-Flavored Markdown
- Syntax-highlighted code blocks
- Autosave to localStorage

\`\`\`ts
const greeting = "Hello, Marksmith!";
\`\`\`

| Mode | Description |
| ---- | ----------- |
| Raw | Edit canonical Markdown |
| Preview | Rendered output |
| Split | Live side-by-side |
| Hybrid | Softened syntax (prototype) |
| HTML | Edit rendered HTML |
| Compare | Markdown ↔ HTML source |

- [x] Task list support
- [ ] Full rich-text editing (future)
`

export function createDocument(
  overrides: Partial<MarkdownDocument> = {},
): MarkdownDocument {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    markdown: DEFAULT_MARKDOWN,
    dirty: false,
    updatedAt: now,
    ...overrides,
  }
}

export function createTab(
  overrides: Partial<Omit<DocumentTab, 'id' | 'document' | 'baseline'>> & {
    document?: Partial<MarkdownDocument>
    baseline?: TabBaseline
  } = {},
): DocumentTab {
  const { document: docOverrides, baseline, ...rest } = overrides
  const document = createDocument(docOverrides)
  return {
    id: crypto.randomUUID(),
    document,
    mode: 'raw',
    saveStatus: 'saved',
    baseline: baseline ?? {
      title: document.title,
      markdown: document.markdown,
    },
    ...rest,
  }
}

export function createInitialAppState(): AppState {
  const tab = createTab()
  return {
    tabs: [tab],
    activeTabId: tab.id,
    theme: resolveInitialTheme(),
    zenMode: false,
  }
}

export function getActiveTab(state: AppState): DocumentTab {
  const tab = state.tabs.find((entry) => entry.id === state.activeTabId)
  if (!tab) return state.tabs[0]!
  return tab
}

export function tabLabel(tab: DocumentTab): string {
  if (tab.sourceName) return tab.sourceName
  const title = tab.document.title.trim()
  return title || 'Untitled'
}

export function nextActiveTabId(
  tabs: DocumentTab[],
  closingTabId: string,
): string {
  const index = tabs.findIndex((tab) => tab.id === closingTabId)
  if (index < 0) return tabs[0]?.id ?? ''
  const next = tabs[index + 1] ?? tabs[index - 1]
  return next?.id ?? ''
}

export function findTabForLinkedFile(
  tabs: DocumentTab[],
  linkedPath?: string | null,
  sourceName?: string,
): DocumentTab | undefined {
  if (linkedPath) {
    const match = tabs.find((tab) => tab.linkedPath === linkedPath)
    if (match) return match
  }
  if (sourceName) {
    return tabs.find(
      (tab) => tab.sourceName === sourceName && Boolean(tab.sourceName),
    )
  }
  return undefined
}

export function ensureTabBaseline(tab: DocumentTab): DocumentTab {
  if (tab.baseline) return tab
  return {
    ...tab,
    baseline: {
      title: tab.document.title,
      markdown: tab.document.markdown,
    },
  }
}

function updateTab(
  state: AppState,
  tabId: string,
  updater: (tab: DocumentTab) => DocumentTab,
): AppState {
  return {
    ...state,
    tabs: state.tabs.map((tab) => (tab.id === tabId ? updater(tab) : tab)),
  }
}

function updateActiveTab(
  state: AppState,
  updater: (tab: DocumentTab) => DocumentTab,
): AppState {
  return updateTab(state, state.activeTabId, updater)
}

export type AppAction =
  | { type: 'setMarkdown'; markdown: string }
  | { type: 'setTitle'; title: string }
  | { type: 'setMode'; mode: EditorMode }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'toggleTheme' }
  | { type: 'setSaveStatus'; saveStatus: SaveStatus; tabId?: string }
  | { type: 'markSaved'; savedAt: string; tabId?: string }
  | {
      type: 'restoreWorkspace'
      tabs: DocumentTab[]
      activeTabId: string
      theme?: Theme
    }
  | {
      type: 'openInNewTab'
      title: string
      markdown: string
      mode?: EditorMode
      sourceName?: string
      linkedPath?: string | null
      activate?: boolean
    }
  | { type: 'addTab'; mode?: EditorMode }
  | { type: 'switchTab'; tabId: string }
  | { type: 'closeTab'; tabId: string }
  | { type: 'revertTab'; tabId: string }
  | { type: 'setTabLinkedFile'; tabId: string; sourceName?: string; linkedPath?: string | null }
  | { type: 'toggleZenMode' }
  | { type: 'setZenMode'; zenMode: boolean }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setMarkdown': {
      const active = getActiveTab(state)
      if (action.markdown === active.document.markdown) return state
      return updateActiveTab(state, (tab) => ({
        ...tab,
        document: {
          ...tab.document,
          markdown: action.markdown,
          dirty: true,
          updatedAt: new Date().toISOString(),
        },
        saveStatus: 'unsaved',
      }))
    }
    case 'setTitle': {
      const active = getActiveTab(state)
      if (action.title === active.document.title) return state
      return updateActiveTab(state, (tab) => ({
        ...tab,
        document: {
          ...tab.document,
          title: action.title,
          dirty: true,
          updatedAt: new Date().toISOString(),
        },
        saveStatus: 'unsaved',
      }))
    }
    case 'setMode':
      return updateActiveTab(state, (tab) => ({ ...tab, mode: action.mode }))
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'toggleTheme':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      }
    case 'setSaveStatus': {
      const tabId = action.tabId ?? state.activeTabId
      return updateTab(state, tabId, (tab) => ({
        ...tab,
        saveStatus: action.saveStatus,
      }))
    }
    case 'markSaved': {
      const tabId = action.tabId ?? state.activeTabId
      return updateTab(state, tabId, (tab) => ({
        ...tab,
        document: {
          ...tab.document,
          dirty: false,
          lastSavedAt: action.savedAt,
        },
        saveStatus: 'saved',
        baseline: {
          title: tab.document.title,
          markdown: tab.document.markdown,
        },
      }))
    }
    case 'restoreWorkspace':
      return {
        ...state,
        tabs: action.tabs.length > 0 ? action.tabs : [createTab()],
        activeTabId:
          action.tabs.some((tab) => tab.id === action.activeTabId)
            ? action.activeTabId
            : (action.tabs[0]?.id ?? createTab().id),
        theme: action.theme ?? state.theme,
      }
    case 'openInNewTab': {
      const tab = createTab({
        document: {
          title: action.title,
          markdown: action.markdown,
          dirty: false,
        },
        mode: action.mode ?? 'raw',
        saveStatus: 'saved',
        sourceName: action.sourceName,
        linkedPath: action.linkedPath,
      })
      return {
        ...state,
        tabs: [...state.tabs, tab],
        activeTabId: action.activate === false ? state.activeTabId : tab.id,
      }
    }
    case 'addTab': {
      const tab = createTab({
        document: {
          title: 'Untitled',
          markdown: '',
          dirty: false,
        },
        mode: action.mode ?? 'raw',
        saveStatus: 'saved',
      })
      return {
        ...state,
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      }
    }
    case 'switchTab':
      if (!state.tabs.some((tab) => tab.id === action.tabId)) return state
      return { ...state, activeTabId: action.tabId }
    case 'closeTab': {
      if (state.tabs.length <= 1) {
        const tab = createTab({
          document: { title: 'Untitled', markdown: '', dirty: false },
          mode: 'raw',
          saveStatus: 'saved',
        })
        return {
          ...state,
          tabs: [tab],
          activeTabId: tab.id,
        }
      }
      const remaining = state.tabs.filter((tab) => tab.id !== action.tabId)
      const activeTabId =
        state.activeTabId === action.tabId
          ? nextActiveTabId(state.tabs, action.tabId)
          : state.activeTabId
      return { ...state, tabs: remaining, activeTabId }
    }
    case 'revertTab':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        document: {
          ...tab.document,
          title: tab.baseline.title,
          markdown: tab.baseline.markdown,
          dirty: false,
          updatedAt: new Date().toISOString(),
        },
        saveStatus: 'saved',
      }))
    case 'setTabLinkedFile':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        sourceName: action.sourceName,
        linkedPath: action.linkedPath,
      }))
    case 'toggleZenMode':
      return { ...state, zenMode: !state.zenMode }
    case 'setZenMode':
      return { ...state, zenMode: action.zenMode }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
