import { beforeEach, describe, expect, it } from 'vitest'
import {
  DOCUMENT_MODES_KEY,
  DOCUMENT_SIDEBAR_KEY,
  documentModeKey,
  loadDocumentMode,
  loadDocumentSidebarPrefs,
  migrateDocumentModeKey,
  saveDocumentMode,
  saveDocumentSidebarPrefs,
} from '../documents/documentPreferences'

describe('documentPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keys file-backed docs by sourceName', () => {
    expect(documentModeKey({ sourceName: 'notes.md', title: 'Notes' })).toBe(
      'file:notes.md',
    )
  })

  it('keys untitled docs by title', () => {
    expect(documentModeKey({ title: 'Draft' })).toBe('title:Draft')
  })

  it('saves and loads mode per key', () => {
    saveDocumentMode('file:notes.md', 'compare')
    expect(loadDocumentMode({ sourceName: 'notes.md', title: 'Notes' })).toBe(
      'compare',
    )
  })

  it('returns fallback when no saved mode', () => {
    expect(loadDocumentMode({ title: 'New' }, 'split')).toBe('split')
    expect(localStorage.getItem(DOCUMENT_MODES_KEY)).toBeNull()
  })

  it('normalizes blank titles to Untitled', () => {
    expect(documentModeKey({ title: '   ' })).toBe('title:Untitled')
  })

  it('migrates a stored mode to a new key', () => {
    saveDocumentMode('title:Draft', 'html')
    migrateDocumentModeKey('title:Draft', 'title:Renamed')
    expect(loadDocumentMode({ title: 'Renamed' })).toBe('html')
    expect(loadDocumentMode({ title: 'Draft' })).toBeUndefined()
  })

  it('saves and loads sidebar prefs per document', () => {
    saveDocumentSidebarPrefs(
      { title: 'Notes' },
      { open: true, tab: 'frontmatter' },
    )
    expect(loadDocumentSidebarPrefs({ title: 'Notes' })).toEqual({
      open: true,
      tab: 'frontmatter',
    })
    expect(localStorage.getItem(DOCUMENT_SIDEBAR_KEY)).toBeTruthy()
  })

  it('migrates sidebar prefs with mode keys', () => {
    saveDocumentSidebarPrefs(
      { title: 'Draft' },
      { open: true, tab: 'outline' },
    )
    migrateDocumentModeKey('title:Draft', 'title:Renamed')
    expect(loadDocumentSidebarPrefs({ title: 'Renamed' })).toEqual({
      open: true,
      tab: 'outline',
    })
  })
})
