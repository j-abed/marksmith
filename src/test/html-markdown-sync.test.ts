import { describe, expect, it, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHtmlMarkdownSync } from '../editor/useHtmlMarkdownSync'

vi.mock('../markdown/renderMarkdown', () => ({
  renderMarkdownToHtml: vi.fn(async (md: string) => `<p>${md}</p>`),
}))

vi.mock('../markdown/importContent', () => ({
  htmlToMarkdown: vi.fn(async (html: string) => html.replace(/<[^>]+>/g, '')),
}))

describe('useHtmlMarkdownSync', () => {
  it('derives html from markdown on mount', async () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useHtmlMarkdownSync('# Hello', onChange),
    )

    await waitFor(() => {
      expect(result.current.ready).toBe(true)
    })

    expect(result.current.html).toBe('<p># Hello</p>')
  })

  it('converts html edits back to markdown', async () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useHtmlMarkdownSync('# Hello', onChange),
    )

    await waitFor(() => {
      expect(result.current.ready).toBe(true)
    })

    act(() => {
      result.current.onHtmlChange('<p>Updated</p>')
    })

    expect(result.current.html).toBe('<p>Updated</p>')

    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalledWith('Updated')
      },
      { timeout: 2000 },
    )
  })
})
