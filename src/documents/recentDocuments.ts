export type RecentDocument = {
  id: string
  title: string
  sourceName?: string
  markdown: string
  openedAt: string
  importedFromHtml?: boolean
}

export const RECENT_DOCUMENTS_KEY = 'marksmith:recent'
export const MAX_RECENT_DOCUMENTS = 10

export function loadRecentDocuments(): RecentDocument[] {
  try {
    const raw = localStorage.getItem(RECENT_DOCUMENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentDocument[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) =>
        typeof entry.id === 'string' &&
        typeof entry.title === 'string' &&
        typeof entry.markdown === 'string' &&
        typeof entry.openedAt === 'string',
    )
  } catch {
    return []
  }
}

export function saveRecentDocuments(entries: RecentDocument[]): void {
  try {
    localStorage.setItem(
      RECENT_DOCUMENTS_KEY,
      JSON.stringify(entries.slice(0, MAX_RECENT_DOCUMENTS)),
    )
  } catch {
    // ignore
  }
}

function isSameRecent(
  entry: RecentDocument,
  input: { title: string; markdown: string; sourceName?: string },
): boolean {
  if (input.sourceName || entry.sourceName) {
    return input.sourceName === entry.sourceName
  }
  return entry.title === input.title
}

export function addRecentDocument(input: {
  title: string
  markdown: string
  sourceName?: string
  importedFromHtml?: boolean
}): RecentDocument[] {
  const title = input.title.trim() || 'Untitled'
  const existing = loadRecentDocuments()
  const prior = existing.find((entry) => isSameRecent(entry, input))
  const importedFromHtml =
    input.importedFromHtml ?? prior?.importedFromHtml ?? false

  const nextEntry: RecentDocument = {
    id: crypto.randomUUID(),
    title,
    sourceName: input.sourceName,
    markdown: input.markdown,
    openedAt: new Date().toISOString(),
    importedFromHtml,
  }

  const filtered = existing.filter((entry) => !isSameRecent(entry, input))

  const next = [nextEntry, ...filtered].slice(0, MAX_RECENT_DOCUMENTS)
  saveRecentDocuments(next)
  return next
}

export function clearRecentDocuments(): void {
  try {
    localStorage.removeItem(RECENT_DOCUMENTS_KEY)
  } catch {
    // ignore
  }
}

export function formatRecentLabel(entry: RecentDocument): string {
  if (entry.sourceName) return entry.sourceName
  return entry.title
}

export function formatRecentDescription(
  entry: RecentDocument,
  timeLabel: string,
): string {
  const parts = [timeLabel]
  if (entry.importedFromHtml) parts.push('Imported from HTML')
  return parts.join(' · ')
}
