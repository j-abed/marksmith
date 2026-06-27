import { describe, expect, it } from 'vitest'
import { htmlToMarkdown, normalizeImportedContent } from '../markdown/importContent'

describe('html import', () => {
  it('converts common html structures to markdown', async () => {
    const html = `<h1>Title</h1>
<p>Hello <strong>world</strong>.</p>
<ul>
  <li>One</li>
  <li>Two</li>
</ul>
<blockquote><p>A quote</p></blockquote>`

    const markdown = await htmlToMarkdown(html)
    expect(markdown).toContain('# Title')
    expect(markdown).toContain('**world**')
    expect(markdown).toContain('* One')
    expect(markdown).toContain('> A quote')
  })

  it('passes through markdown unchanged', async () => {
    const md = '# Hello\n\nPlain markdown.'
    const result = await normalizeImportedContent(md)
    expect(result.convertedFromHtml).toBe(false)
    expect(result.markdown).toBe(md)
  })

  it('normalizes html fragments', async () => {
    const result = await normalizeImportedContent(
      '<p>Intro</p><p>Second paragraph</p>',
    )
    expect(result.convertedFromHtml).toBe(true)
    expect(result.markdown).toContain('Intro')
    expect(result.markdown).toContain('Second paragraph')
  })
})
