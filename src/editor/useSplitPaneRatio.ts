import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampSplitRatio,
  loadSplitRatio,
  SPLIT_RATIO_STORAGE_KEY,
} from './splitPaneRatio'

export function useSplitPaneRatio() {
  const [ratio, setRatio] = useState(loadSplitRatio)
  const dragging = useRef(false)
  const panesRef = useRef<HTMLDivElement | null>(null)

  const persist = useCallback((value: number) => {
    try {
      localStorage.setItem(SPLIT_RATIO_STORAGE_KEY, String(value))
    } catch {
      // ignore
    }
  }, [])

  const onDividerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragging.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.classList.add('is-dragging')
      document.body.classList.add('is-split-resizing')
    },
    [],
  )

  const onDividerPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current || !panesRef.current) return
      const rect = panesRef.current.getBoundingClientRect()
      const next = (event.clientX - rect.left) / rect.width
      setRatio(clampSplitRatio(next))
    },
    [],
  )

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return
      dragging.current = false
      event.currentTarget.releasePointerCapture(event.pointerId)
      event.currentTarget.classList.remove('is-dragging')
      document.body.classList.remove('is-split-resizing')
      setRatio((current) => {
        persist(current)
        return current
      })
    },
    [persist],
  )

  useEffect(() => {
    return () => {
      document.body.classList.remove('is-split-resizing')
    }
  }, [])

  return {
    ratio,
    panesRef,
    onDividerPointerDown,
    onDividerPointerMove,
    onDividerPointerUp: endDrag,
    onDividerPointerCancel: endDrag,
  }
}
