import type { EditorMode } from '../app/appState'

export const DOCUMENT_MODES_KEY = 'marksmith:doc-modes'

export function documentModeKey(input: {
  sourceName?: string
  title: string
}): string {
  if (input.sourceName) return `file:${input.sourceName}`
  const title = input.title.trim() || 'Untitled'
  return `title:${title}`
}

export function loadDocumentModes(): Record<string, EditorMode> {
  try {
    const raw = localStorage.getItem(DOCUMENT_MODES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, EditorMode>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDocumentMode(
  key: string,
  mode: EditorMode,
): Record<string, EditorMode> {
  const next = { ...loadDocumentModes(), [key]: mode }
  try {
    localStorage.setItem(DOCUMENT_MODES_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

export function loadDocumentMode(
  input: { sourceName?: string; title: string },
  fallback?: EditorMode,
): EditorMode | undefined {
  const key = documentModeKey(input)
  return loadDocumentModes()[key] ?? fallback
}

export function migrateDocumentModeKey(fromKey: string, toKey: string): void {
  if (fromKey === toKey) return
  const modes = loadDocumentModes()
  const mode = modes[fromKey]
  if (!mode) return
  const next = { ...modes }
  delete next[fromKey]
  next[toKey] = mode
  try {
    localStorage.setItem(DOCUMENT_MODES_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}
