import type { MarkdownDocument } from '../app/appState'

export const AUTOSAVE_KEY = 'marksmith:draft'
export const AUTOSAVE_DEBOUNCE_MS = 500

export type AutosavePayload = {
  document: MarkdownDocument
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
    return JSON.parse(raw) as AutosavePayload
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
