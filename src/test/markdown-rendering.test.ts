import { describe, expect, it } from 'vitest'
import { renderMarkdownToHtml } from '../markdown/renderMarkdown'

describe('markdown rendering', () => {
  it('renders GFM tables', async () => {
    const md = `| A | B |
| - | - |
| 1 | 2 |`
    const html = await renderMarkdownToHtml(md)
    expect(html).toContain('<table')
    expect(html).toContain('<td>1</td>')
    expect(html).toContain('src-line-')
  })

  it('renders GFM task lists', async () => {
    const md = `- [x] Done\n- [ ] Todo`
    const html = await renderMarkdownToHtml(md)
    expect(html).toContain('task-list-item')
    expect(html).toContain('Done')
    expect(html).toContain('Todo')
  })

  it('sanitizes script tags from output', async () => {
    const md = `<script>alert("xss")</script>\n\n# Hello`
    const html = await renderMarkdownToHtml(md)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(')
  })

  it('strips javascript: URLs from links', async () => {
    const md = `[click me](javascript:alert(1))`
    const html = await renderMarkdownToHtml(md)
    expect(html).not.toContain('javascript:')
  })

  it('strips event handler attributes', async () => {
    const md = `<img src="x" onerror="alert(1)" />`
    const html = await renderMarkdownToHtml(md)
    expect(html).not.toContain('onerror')
  })
})
