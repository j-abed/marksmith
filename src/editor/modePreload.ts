import type { EditorMode } from '../app/appState'

export function preloadEditorMode(mode: EditorMode): void {
  switch (mode) {
    case 'preview':
      void import('./PreviewPane')
      break
    case 'split':
      void import('./SplitEditor')
      break
    case 'hybrid':
      void import('./HybridEditor')
      break
    case 'html':
      void import('./HtmlEditor')
      break
    case 'compare':
      void import('./CompareEditor')
      break
    default:
      break
  }
}

export function preloadSecondaryModes(): void {
  void import('./PreviewPane')
  void import('./SplitEditor')
  void import('./HybridEditor')
  void import('./HtmlEditor')
  void import('./CompareEditor')
}
