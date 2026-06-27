import type { EditorMode } from '../app/appState'

export type EditorModeOption = {
  id: EditorMode
  label: string
  description: string
}

export const EDITOR_MODES: EditorModeOption[] = [
  { id: 'raw', label: 'Raw', description: 'Edit Markdown source' },
  { id: 'preview', label: 'Preview', description: 'Rendered output' },
  { id: 'split', label: 'Split', description: 'Markdown and preview side by side' },
  { id: 'hybrid', label: 'Hybrid', description: 'Softened syntax highlighting' },
  { id: 'html', label: 'HTML', description: 'Edit rendered HTML' },
  { id: 'compare', label: 'Compare', description: 'Markdown ↔ HTML source' },
]

export function editorModeLabel(mode: EditorMode): string {
  return EDITOR_MODES.find((entry) => entry.id === mode)?.label ?? 'Raw'
}
