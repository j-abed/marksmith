import { describe, expect, it } from 'vitest'
import { isSupportedDocumentFile, titleFromFilename } from '../documents/fileAccess'

describe('fileAccess helpers', () => {
  it('derives title from filename', () => {
    expect(titleFromFilename('notes/my-draft.md')).toBe('my-draft')
    expect(titleFromFilename('README.markdown')).toBe('README')
    expect(titleFromFilename('plain.txt')).toBe('plain')
    expect(titleFromFilename('page.html')).toBe('page')
    expect(titleFromFilename('.md')).toBe('Untitled')
  })

  it('detects supported document files', () => {
    expect(isSupportedDocumentFile(new File([''], 'doc.md'))).toBe(true)
    expect(isSupportedDocumentFile(new File([''], 'doc.markdown'))).toBe(true)
    expect(isSupportedDocumentFile(new File([''], 'doc.txt'))).toBe(true)
    expect(isSupportedDocumentFile(new File([''], 'doc.html'))).toBe(true)
    expect(isSupportedDocumentFile(new File([''], 'doc.pdf'))).toBe(false)
  })
})
