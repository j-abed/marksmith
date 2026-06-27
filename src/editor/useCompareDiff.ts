import { useEffect, useState } from 'react'
import { htmlToMarkdown } from '../markdown/importContent'
import { renderMarkdownToHtml } from '../markdown/renderMarkdown'
import {
  computeDiffLineIndices,
  textsEqual,
} from './compareDiff'

const ROUND_TRIP_DEBOUNCE_MS = 400

export function useCompareDiff(
  markdown: string,
  html: string,
  ready: boolean,
) {
  const [diffLines, setDiffLines] = useState<number[]>([])
  const [roundTripDrift, setRoundTripDrift] = useState(false)

  useEffect(() => {
    if (!ready) {
      setDiffLines([])
      return
    }

    let cancelled = false
    void renderMarkdownToHtml(markdown).then((expectedHtml) => {
      if (cancelled) return
      setDiffLines(computeDiffLineIndices(expectedHtml, html))
    })

    return () => {
      cancelled = true
    }
  }, [markdown, html, ready])

  useEffect(() => {
    if (!ready || !html.trim()) {
      setRoundTripDrift(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      void htmlToMarkdown(html).then((roundTripMd) => {
        if (cancelled) return
        setRoundTripDrift(!textsEqual(roundTripMd, markdown))
      })
    }, ROUND_TRIP_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [markdown, html, ready])

  return {
    diffLines,
    diffLineCount: diffLines.length,
    hasDiff: diffLines.length > 0,
    roundTripDrift,
  }
}
