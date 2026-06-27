import { useCallback, useEffect, useRef, useState } from 'react'
import { htmlToMarkdown } from '../markdown/importContent'
import { renderMarkdownToHtml } from '../markdown/renderMarkdown'

const SYNC_DEBOUNCE_MS = 350

export function useHtmlMarkdownSync(
  markdown: string,
  onMarkdownChange: (markdown: string) => void,
) {
  const [html, setHtml] = useState('')
  const [ready, setReady] = useState(false)
  const htmlEditingRef = useRef(false)
  const debounceRef = useRef<number | null>(null)
  const markdownRef = useRef(markdown)
  const htmlRef = useRef('')
  const onChangeRef = useRef(onMarkdownChange)

  onChangeRef.current = onMarkdownChange
  markdownRef.current = markdown
  htmlRef.current = html

  const clearPendingHtmlEdit = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    htmlEditingRef.current = false
  }, [])

  const syncHtmlFromMarkdown = useCallback(async () => {
    clearPendingHtmlEdit()
    const nextHtml = await renderMarkdownToHtml(markdownRef.current)
    setHtml(nextHtml)
    setReady(true)
    return nextHtml
  }, [clearPendingHtmlEdit])

  const applyHtmlToMarkdown = useCallback(async () => {
    clearPendingHtmlEdit()
    const md = await htmlToMarkdown(htmlRef.current)
    if (md !== markdownRef.current) {
      onChangeRef.current(md)
    }
    const nextHtml = await renderMarkdownToHtml(md)
    setHtml(nextHtml)
    setReady(true)
    return md
  }, [clearPendingHtmlEdit])

  useEffect(() => {
    if (htmlEditingRef.current) return

    let cancelled = false
    void renderMarkdownToHtml(markdown).then((nextHtml) => {
      if (cancelled) return
      setHtml(nextHtml)
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [markdown])

  const onHtmlChange = useCallback((nextHtml: string) => {
    setHtml(nextHtml)
    htmlEditingRef.current = true

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null
      void htmlToMarkdown(nextHtml)
        .then((md) => {
          if (md !== markdownRef.current) {
            onChangeRef.current(md)
          }
          htmlEditingRef.current = false
        })
        .catch(() => {
          htmlEditingRef.current = false
        })
    }, SYNC_DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    html,
    onHtmlChange,
    ready,
    syncHtmlFromMarkdown,
    applyHtmlToMarkdown,
  }
}
