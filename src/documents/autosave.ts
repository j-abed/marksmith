import type { DocumentTab } from '../app/appState'

export const AUTOSAVE_KEY = 'marksmith:draft'
export const AUTOSAVE_DEBOUNCE_MS = 500

export type AutosavePayload = {
  tabs: DocumentTab[]
  activeTabId: string
  theme?: string
}

/** @deprecated Single-document draft format — migrated on load */
export type LegacyAutosavePayload = {
  document: DocumentTab['document']
  mode?: string
  theme?: string
}

export function saveDraft(payload: AutosavePayload): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

export function loadDraft(): AutosavePayload | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AutosavePayload | LegacyAutosavePayload
    if ('tabs' in parsed && Array.isArray(parsed.tabs) && parsed.activeTabId) {
      return {
        ...parsed,
        tabs: parsed.tabs.map((tab) => ({
          ...tab,
          baseline: tab.baseline ?? {
            title: tab.document.title,
            markdown: tab.document.markdown,
          },
        })),
      }
    }
    if ('document' in parsed && parsed.document) {
      const tab: DocumentTab = {
        id: parsed.document.id,
        document: { ...parsed.document, dirty: false },
        mode: (parsed.mode as DocumentTab['mode']) ?? 'raw',
        saveStatus: 'saved',
        baseline: {
          title: parsed.document.title,
          markdown: parsed.document.markdown,
        },
      }
      return {
        tabs: [tab],
        activeTabId: tab.id,
        theme: parsed.theme,
      }
    }
    return null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY)
  } catch {
    // ignore
  }
}
