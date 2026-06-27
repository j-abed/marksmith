import { describe, expect, it } from 'vitest'
import {
  safeExportBasename,
  wrapHtmlDocument,
  buildExportContent,
} from '../documents/exportDocument'

describe('exportDocument helpers', () => {
  it('slugifies titles for filenames', () => {
    expect(safeExportBasename('My Draft #1')).toBe('my-draft-1')
    expect(safeExportBasename('')).toBe('untitled')
  })

  it('wraps HTML with document shell', () => {
    const html = wrapHtmlDocument('Test & Co', '<p>Hello</p>')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>Test &amp; Co</title>')
    expect(html).toContain('<p>Hello</p>')
  })

  it('builds markdown export payload', async () => {
    const result = await buildExportContent('Note', '# Hi', 'md')
    expect(result.filename).toBe('note.md')
    expect(result.content).toBe('# Hi')
    expect(result.mimeType).toBe('text/markdown')
  })

  it('builds json export payload', async () => {
    const result = await buildExportContent('Note', '# Hi', 'json')
    expect(result.filename).toBe('note.json')
    const parsed = JSON.parse(result.content) as {
      title: string
      markdown: string
    }
    expect(parsed.title).toBe('Note')
    expect(parsed.markdown).toBe('# Hi')
  })

  it('builds sanitized html export payload', async () => {
    const result = await buildExportContent(
      'Note',
      '<script>x</script>\n\n# Safe',
      'html',
    )
    expect(result.filename).toBe('note.html')
    expect(result.content).not.toContain('<script')
    expect(result.content).toContain('<h1')
  })
})
