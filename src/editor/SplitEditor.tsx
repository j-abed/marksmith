import { useRef, useState, useCallback, useEffect, type RefObject } from 'react'
import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { RawEditor } from './RawEditor'
import { PreviewPane } from './PreviewPane'
import { useSplitPaneRatio } from './useSplitPaneRatio'
import {
  collectSourceAnchors,
  createSplitScrollSync,
  getEditorSourceLine,
  scrollEditorToLine,
  scrollPreviewToLine,
  type SourceAnchor,
} from './scrollSync'

type SplitEditorProps = {
  value: string
  onChange: (value: string) => void
  appKeymap?: Extension
  editorRef?: RefObject<EditorView | null>
}

export function SplitEditor({
  value,
  onChange,
  appKeymap,
  editorRef: externalEditorRef,
}: SplitEditorProps) {
  const localEditorRef = useRef<EditorView | null>(null)
  const editorRef = externalEditorRef ?? localEditorRef
  const previewRef = useRef<HTMLDivElement | null>(null)
  const anchorsRef = useRef<SourceAnchor[]>([])
  const scrollSync = useRef(createSplitScrollSync())
  const lineLabelRef = useRef<HTMLSpanElement>(null)
  const [syncScroll, setSyncScroll] = useState(true)
  const [activeLine, setActiveLine] = useState(1)
  const {
    ratio,
    panesRef,
    onDividerPointerDown,
    onDividerPointerMove,
    onDividerPointerUp,
    onDividerPointerCancel,
  } = useSplitPaneRatio()

  const refreshAnchors = useCallback(() => {
    const preview = previewRef.current
    if (!preview) return
    anchorsRef.current = collectSourceAnchors(preview)
  }, [])

  const updateLineLabel = useCallback((line: number) => {
    if (lineLabelRef.current) {
      lineLabelRef.current.textContent = `Click a preview block to jump the editor · Line ${line}`
    }
  }, [])

  const handleEditorScroll = useCallback(
    (view: EditorView) => {
      const preview = previewRef.current
      if (!preview) return

      scrollSync.current.onEditorScroll(
        view.scrollDOM,
        preview,
        syncScroll,
      )
      updateLineLabel(getEditorSourceLine(view))
    },
    [syncScroll, updateLineLabel],
  )

  const handlePreviewScroll = useCallback(() => {
    const view = editorRef.current
    const preview = previewRef.current
    if (!view || !preview) return

    scrollSync.current.onPreviewScroll(
      view.scrollDOM,
      preview,
      syncScroll,
    )
    updateLineLabel(getEditorSourceLine(view))
  }, [syncScroll, updateLineLabel])

  useEffect(() => {
    const preview = previewRef.current
    if (!preview) return
    const onScroll = () => handlePreviewScroll()
    preview.addEventListener('scroll', onScroll, { passive: true })
    return () => preview.removeEventListener('scroll', onScroll)
  }, [handlePreviewScroll])

  const handleSourceLineClick = useCallback((line: number) => {
    const view = editorRef.current
    const preview = previewRef.current
    if (!view) return

    scrollEditorToLine(view, line)
    if (preview) {
      scrollPreviewToLine(preview, line, anchorsRef.current)
    }

    const docLine = view.state.doc.line(
      Math.min(line, view.state.doc.lines),
    )
    setActiveLine(docLine.number)
    view.dispatch({ selection: { anchor: docLine.from } })
    view.focus()
  }, [])

  const handlePreviewReady = useCallback(() => {
    refreshAnchors()
  }, [refreshAnchors])

  const editorBasis = `calc(${ratio * 100}% - 3px)`
  const previewBasis = `calc(${(1 - ratio) * 100}% - 3px)`

  return (
    <div className="split-editor" data-testid="split-editor">
      <div className="split-editor__toolbar">
        <label className="split-editor__sync-toggle">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
          />
          Sync scroll
        </label>
        <span
          ref={lineLabelRef}
          className="split-editor__hint"
          data-testid="split-active-line"
        >
          Click a preview block to jump the editor · Line {activeLine}
        </span>
      </div>
      <div className="split-editor__panes" ref={panesRef}>
        <div
          className="split-editor__pane split-editor__pane--raw"
          style={{ flex: `0 0 ${editorBasis}` }}
        >
          <RawEditor
            value={value}
            onChange={onChange}
            scrollKey="split-raw"
            editorRef={editorRef}
            onScroll={handleEditorScroll}
            appKeymap={appKeymap}
          />
        </div>
        <div
          className="split-editor__divider"
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(ratio * 100)}
          aria-valuemin={22}
          aria-valuemax={78}
          aria-label="Resize panes"
          tabIndex={0}
          onPointerDown={onDividerPointerDown}
          onPointerMove={onDividerPointerMove}
          onPointerUp={onDividerPointerUp}
          onPointerCancel={onDividerPointerCancel}
        />
        <div
          className="split-editor__pane split-editor__pane--preview"
          style={{ flex: `0 0 ${previewBasis}` }}
        >
          <PreviewPane
            markdown={value}
            containerRef={previewRef}
            onSourceLineClick={handleSourceLineClick}
            onContentReady={handlePreviewReady}
            enableBlockNavigation
          />
        </div>
      </div>
    </div>
  )
}
