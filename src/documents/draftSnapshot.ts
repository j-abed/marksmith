import type { AppState } from '../app/appState'

export function draftSnapshot(state: AppState): string {
  return JSON.stringify({
    tabs: state.tabs.map((tab) => ({
      id: tab.id,
      title: tab.document.title,
      markdown: tab.document.markdown,
      mode: tab.mode,
      sourceName: tab.sourceName,
      linkedPath: tab.linkedPath,
    })),
    activeTabId: state.activeTabId,
    theme: state.theme,
  })
}
