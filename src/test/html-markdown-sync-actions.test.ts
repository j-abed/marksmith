import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHtmlMarkdownSync } from '../editor/useHtmlMarkdownSync'

vi.mock('../markdown/renderMarkdown', () => ({
  renderMarkdownToHtml: vi.fn(async (md: string) => `<p>${md}</p>`),
}))

vi.mock('../markdown/importContent', () => ({
  htmlToMarkdown: vi.fn(async (html: string) => html.replace(/<[^>]+>/g, '')),
}))

describe('useHtmlMarkdownSync actions', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('syncHtmlFromMarkdown regenerates html from markdown', async () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useHtmlMarkdownSync('# Hello', onChange),
    )

    await waitFor(() => {
      expect(result.current.ready).toBe(true)
    })

    act(() => {
      result.current.onHtmlChange('<p>Edited</p>')
    })

    await act(async () => {
      await result.current.syncHtmlFromMarkdown()
    })

    expect(result.current.html).toBe('<p># Hello</p>')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('applyHtmlToMarkdown updates canonical markdown', async () => {
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

    await act(async () => {
      await result.current.applyHtmlToMarkdown()
    })

    expect(onChange).toHaveBeenCalledWith('Updated')
    expect(result.current.html).toBe('<p>Updated</p>')
  })
})
