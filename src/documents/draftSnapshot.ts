import type { AppState } from '../app/appState'

export function draftSnapshot(state: AppState): string {
  return JSON.stringify({
    markdown: state.document.markdown,
    title: state.document.title,
    mode: state.mode,
    theme: state.theme,
  })
}
