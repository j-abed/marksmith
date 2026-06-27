import { useEffect, useState } from 'react'
import { htmlToMarkdown } from '../markdown/importContent'
import { renderMarkdownToHtml } from '../markdown/renderMarkdown'
import {
  computeCompareDiff,
  type CompareDiffResult,
  textsEqual,
} from './compareDiff'

const ROUND_TRIP_DEBOUNCE_MS = 400

const emptyDiff: CompareDiffResult = {
  fullLines: [],
  wordSpans: [],
  touchedLines: [],
}

export function useCompareDiff(
  markdown: string,
  html: string,
  ready: boolean,
) {
  const [compareDiff, setCompareDiff] = useState<CompareDiffResult>(emptyDiff)
  const [roundTripDrift, setRoundTripDrift] = useState(false)

  useEffect(() => {
    if (!ready) {
      setCompareDiff(emptyDiff)
      return
    }

    let cancelled = false
    void renderMarkdownToHtml(markdown).then((expectedHtml) => {
      if (cancelled) return
      setCompareDiff(computeCompareDiff(expectedHtml, html))
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
    compareDiff,
    diffLines: compareDiff.touchedLines,
    diffLineCount: compareDiff.touchedLines.length,
    hasDiff: compareDiff.touchedLines.length > 0,
    roundTripDrift,
  }
}
