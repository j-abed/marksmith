import { describe, expect, it } from 'vitest'
import {
  detectLinkedFileFormat,
  saveFormatLabel,
} from '../documents/linkedFileFormat'

describe('linkedFileFormat', () => {
  it('detects html linked files', () => {
    expect(detectLinkedFileFormat('notes.html')).toBe('html')
    expect(detectLinkedFileFormat('notes.htm')).toBe('html')
  })

  it('defaults other extensions to markdown', () => {
    expect(detectLinkedFileFormat('notes.md')).toBe('markdown')
    expect(detectLinkedFileFormat('notes.txt')).toBe('markdown')
  })

  it('labels save formats', () => {
    expect(saveFormatLabel('html')).toBe('HTML')
    expect(saveFormatLabel('markdown')).toBe('Markdown')
  })
})
