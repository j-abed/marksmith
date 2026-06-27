import { beforeEach, describe, expect, it } from 'vitest'
import {
  RECENT_DOCUMENTS_KEY,
  addRecentDocument,
  clearRecentDocuments,
  formatRecentDescription,
  loadRecentDocuments,
  MAX_RECENT_DOCUMENTS,
  updateRecentDocumentMode,
} from '../documents/recentDocuments'

describe('recentDocuments', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and deduplicates recent documents', () => {
    addRecentDocument({ title: 'Notes', markdown: '# One' })
    addRecentDocument({ title: 'Draft', markdown: '# Two' })
    addRecentDocument({ title: 'Notes', markdown: '# One updated' })

    const recent = loadRecentDocuments()
    expect(recent).toHaveLength(2)
    expect(recent[0]?.title).toBe('Notes')
    expect(recent[0]?.markdown).toBe('# One updated')
    expect(recent[1]?.title).toBe('Draft')
  })

  it('caps the recent list', () => {
    for (let i = 0; i < MAX_RECENT_DOCUMENTS + 3; i++) {
      addRecentDocument({ title: `Doc ${i}`, markdown: `# ${i}` })
    }
    expect(loadRecentDocuments()).toHaveLength(MAX_RECENT_DOCUMENTS)
  })

  it('clears recent documents', () => {
    addRecentDocument({ title: 'Notes', markdown: '# One' })
    clearRecentDocuments()
    expect(loadRecentDocuments()).toEqual([])
    expect(localStorage.getItem(RECENT_DOCUMENTS_KEY)).toBeNull()
  })

  it('stores importedFromHtml and preserves it on update', () => {
    addRecentDocument({
      title: 'Report',
      markdown: '# Hi',
      sourceName: 'report.html',
      importedFromHtml: true,
    })
    addRecentDocument({
      title: 'Report',
      markdown: '# Hi edited',
      sourceName: 'report.html',
    })

    const recent = loadRecentDocuments()
    expect(recent).toHaveLength(1)
    expect(recent[0]?.importedFromHtml).toBe(true)
    expect(recent[0]?.markdown).toBe('# Hi edited')
  })

  it('formatRecentDescription notes HTML import', () => {
    const entry = addRecentDocument({
      title: 'Page',
      markdown: '# x',
      importedFromHtml: true,
    })[0]!
    expect(formatRecentDescription(entry, 'Jun 26')).toBe(
      'Jun 26 · Imported from HTML',
    )
  })

  it('formatRecentDescription notes YAML metadata', () => {
    const entry = addRecentDocument({
      title: 'Brief',
      markdown: '---\ntitle: Brief\n---\n\n# Hi',
    })[0]!
    expect(formatRecentDescription(entry, 'Jun 26')).toBe(
      'Jun 26 · YAML metadata',
    )
  })

  it('preserves id and mode when updating a recent entry', () => {
    const [first] = addRecentDocument({
      title: 'Notes',
      markdown: '# One',
      mode: 'split',
    })
    const [updated] = addRecentDocument({
      title: 'Notes',
      markdown: '# One edited',
      mode: 'compare',
    })
    expect(updated?.id).toBe(first?.id)
    expect(updated?.mode).toBe('compare')
  })

  it('updates mode on an existing recent entry', () => {
    addRecentDocument({ title: 'Notes', markdown: '# One' })
    updateRecentDocumentMode({ title: 'Notes', mode: 'preview' })
    expect(loadRecentDocuments()[0]?.mode).toBe('preview')
  })

  it('preserves prior mode when update omits mode', () => {
    addRecentDocument({ title: 'Notes', markdown: '# One', mode: 'split' })
    addRecentDocument({ title: 'Notes', markdown: '# One edited' })
    expect(loadRecentDocuments()[0]?.mode).toBe('split')
  })
})
