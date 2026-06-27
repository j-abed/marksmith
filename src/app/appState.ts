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

export type AppState = {
  document: MarkdownDocument
  mode: EditorMode
  theme: Theme
  saveStatus: SaveStatus
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

export type AppAction =
  | { type: 'setMarkdown'; markdown: string }
  | { type: 'setTitle'; title: string }
  | { type: 'setMode'; mode: EditorMode }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'toggleTheme' }
  | { type: 'setSaveStatus'; saveStatus: SaveStatus }
  | { type: 'markSaved'; savedAt: string }
  | { type: 'restoreDocument'; document: MarkdownDocument; mode?: EditorMode; theme?: Theme }
  | { type: 'loadDocument'; title: string; markdown: string }
  | { type: 'newDocument' }
  | { type: 'toggleZenMode' }
  | { type: 'setZenMode'; zenMode: boolean }

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setMarkdown':
      if (action.markdown === state.document.markdown) return state
      return {
        ...state,
        document: {
          ...state.document,
          markdown: action.markdown,
          dirty: true,
          updatedAt: new Date().toISOString(),
        },
        saveStatus: 'unsaved',
      }
    case 'setTitle':
      if (action.title === state.document.title) return state
      return {
        ...state,
        document: {
          ...state.document,
          title: action.title,
          dirty: true,
          updatedAt: new Date().toISOString(),
        },
        saveStatus: 'unsaved',
      }
    case 'setMode':
      return { ...state, mode: action.mode }
    case 'setTheme':
      return { ...state, theme: action.theme }
    case 'toggleTheme':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light',
      }
    case 'setSaveStatus':
      return { ...state, saveStatus: action.saveStatus }
    case 'markSaved':
      return {
        ...state,
        document: {
          ...state.document,
          dirty: false,
          lastSavedAt: action.savedAt,
        },
        saveStatus: 'saved',
      }
    case 'restoreDocument':
      return {
        ...state,
        document: action.document,
        mode: action.mode ?? state.mode,
        theme: action.theme ?? state.theme,
        saveStatus: 'saved',
      }
    case 'loadDocument':
      return {
        ...state,
        document: createDocument({
          title: action.title,
          markdown: action.markdown,
          dirty: false,
        }),
        saveStatus: 'saved',
      }
    case 'newDocument':
      return {
        ...state,
        document: createDocument({
          title: 'Untitled',
          markdown: '',
          dirty: false,
        }),
        saveStatus: 'saved',
      }
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
