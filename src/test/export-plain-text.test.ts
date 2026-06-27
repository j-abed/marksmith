import { describe, expect, it } from 'vitest'
import { markdownToPlainText } from '../markdown/markdownToPlainText'

describe('markdownToPlainText', () => {
  it('strips headings and emphasis', () => {
    const md = '# Title\n\n**Bold** and _italic_'
    expect(markdownToPlainText(md)).toBe('Title\n\nBold and italic')
  })

  it('converts links to label text', () => {
    const md = 'See [Marksmith](https://example.com) for details.'
    expect(markdownToPlainText(md)).toBe('See Marksmith for details.')
  })

  it('preserves fenced code content without backticks', () => {
    const md = '```ts\nconst x = 1;\n```'
    expect(markdownToPlainText(md)).toBe('const x = 1;')
  })

  it('converts list markers to bullets', () => {
    const md = '- one\n- two'
    expect(markdownToPlainText(md)).toBe('• one\n• two')
  })
})
