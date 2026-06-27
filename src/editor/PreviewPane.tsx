import { useEffect, useState, type MouseEvent, type RefObject } from 'react'
import { renderMarkdownToReact } from '../markdown/renderMarkdown'
import { parseSourceLineId } from './scrollSync'
import type { ReactElement } from 'react'

type PreviewPaneProps = {
  markdown: string
  className?: string
  containerRef?: RefObject<HTMLDivElement | null>
  activeSourceLine?: number
  onSourceLineClick?: (line: number) => void
  onScroll?: () => void
  onContentReady?: () => void
  enableBlockNavigation?: boolean
}

function parseSourceLineIdFromElement(id: string): number | null {
  return parseSourceLineId(id)
}

export function PreviewPane({
  markdown,
  className = '',
  containerRef,
  activeSourceLine,
  onSourceLineClick,
  onScroll,
  onContentReady,
  enableBlockNavigation = false,
}: PreviewPaneProps) {
  const [content, setContent] = useState<ReactElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      renderMarkdownToReact(markdown)
        .then((result) => {
          if (!cancelled) {
            setContent(result)
            setError(null)
            window.requestAnimationFrame(() => onContentReady?.())
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Render failed')
          }
        })
    }, 100)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [markdown, onContentReady])

  useEffect(() => {
    if (!activeSourceLine || !containerRef?.current) return
    const container = containerRef.current
    const anchors = Array.from(
      container.querySelectorAll<HTMLElement>('[id*="src-line-"]'),
    )
      .map((el) => ({
        el,
        line: parseSourceLineIdFromElement(el.id),
      }))
      .filter(
        (entry): entry is { el: HTMLElement; line: number } =>
          entry.line !== null,
      )
      .sort((a, b) => a.line - b.line)

    let activeEl = anchors[0]?.el
    for (const anchor of anchors) {
      if (anchor.line <= activeSourceLine) activeEl = anchor.el
      else break
    }

    for (const anchor of anchors) {
      anchor.el.classList.toggle(
        'preview-block--active',
        anchor.el === activeEl,
      )
    }
  }, [activeSourceLine, content, containerRef])

  function handleClick(event: MouseEvent<HTMLElement>) {
    if (!enableBlockNavigation || !onSourceLineClick) return
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[id*="src-line-"]',
    )
    if (!target) return
    const line = parseSourceLineIdFromElement(target.id)
    if (line !== null) onSourceLineClick(line)
  }

  if (!markdown.trim()) {
    return (
      <div
        ref={containerRef}
        className={`preview-pane preview-pane--empty ${className}`}
      >
        <p>Nothing to preview yet. Start writing Markdown.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        ref={containerRef}
        className={`preview-pane preview-pane--error ${className}`}
      >
        <p>Preview error: {error}</p>
        <pre>{markdown}</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`preview-pane ${className}${enableBlockNavigation ? ' preview-pane--navigable' : ''}`}
      data-testid="preview-pane"
      onScroll={onScroll}
      onClick={handleClick}
    >
      <article className="preview-content">
        {content ?? <p className="preview-loading">Rendering…</p>}
      </article>
    </div>
  )
}
