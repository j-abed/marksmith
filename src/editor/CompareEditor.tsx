import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { RawEditor } from './RawEditor'
import { HtmlSourceEditor } from './HtmlSourceEditor'
import { useSplitPaneRatio } from './useSplitPaneRatio'
import { useHtmlMarkdownSync } from './useHtmlMarkdownSync'
import { useCompareDiff } from './useCompareDiff'
import { createSplitScrollSync } from './scrollSync'
import { useApp } from '../app/AppProvider'
import {
  applyHtmlCompareDiff,
  htmlDiffExtension,
} from './htmlDiffDecorations'
import { formatCompareDiffHint } from './compareDiff'

type CompareEditorProps = {
  value: string
  onChange: (value: string) => void
  appKeymap?: Extension
  editorRef?: RefObject<EditorView | null>
}

export function CompareEditor({
  value,
  onChange,
  appKeymap,
  editorRef,
}: CompareEditorProps) {
  const { html, onHtmlChange, ready, syncHtmlFromMarkdown, applyHtmlToMarkdown } =
    useHtmlMarkdownSync(value, onChange)
  const { showNotice } = useApp()
  const { compareDiff, diffLineCount, hasDiff, roundTripDrift } = useCompareDiff(
    value,
    html,
    ready,
  )
  const htmlEditorRef = useRef<EditorView | null>(null)
  const scrollSync = useRef(createSplitScrollSync())
  const [syncScroll, setSyncScroll] = useState(true)
  const [showDiff, setShowDiff] = useState(true)
  const diffExtension = useMemo(() => htmlDiffExtension(), [])
  const htmlExtraExtensions = useMemo(
    () => [diffExtension],
    [diffExtension],
  )
  const {
    ratio,
    panesRef,
    onDividerPointerDown,
    onDividerPointerMove,
    onDividerPointerUp,
    onDividerPointerCancel,
  } = useSplitPaneRatio()

  const handleMarkdownScroll = useCallback(
    (view: EditorView) => {
      const htmlView = htmlEditorRef.current
      if (!htmlView) return
      scrollSync.current.onEditorScroll(
        view.scrollDOM,
        htmlView.scrollDOM,
        syncScroll,
      )
    },
    [syncScroll],
  )

  const handleHtmlScroll = useCallback(
    (view: EditorView) => {
      const mdView = editorRef?.current
      if (!mdView) return
      scrollSync.current.onPreviewScroll(
        mdView.scrollDOM,
        view.scrollDOM,
        syncScroll,
      )
    },
    [editorRef, syncScroll],
  )

  useEffect(() => {
    const view = htmlEditorRef.current
    if (!view) return
    applyHtmlCompareDiff(view, showDiff && hasDiff ? compareDiff : {
      fullLines: [],
      wordSpans: [],
      touchedLines: [],
    })
  }, [compareDiff, hasDiff, showDiff])

  const markdownBasis = `calc(${ratio * 100}% - 3px)`
  const htmlBasis = `calc(${(1 - ratio) * 100}% - 3px)`

  const diffHint =
    hasDiff && showDiff
      ? formatCompareDiffHint(compareDiff)
      : hasDiff
        ? `${diffLineCount} differing line${diffLineCount === 1 ? '' : 's'} (highlight hidden)`
        : 'HTML matches Markdown render'

  const canSyncHtml = hasDiff
  const canApplyHtml = hasDiff || roundTripDrift

  const handleSyncHtmlFromMarkdown = useCallback(() => {
    void syncHtmlFromMarkdown().then(() => {
      showNotice('HTML synced from Markdown')
    })
  }, [showNotice, syncHtmlFromMarkdown])

  const handleApplyHtmlToMarkdown = useCallback(() => {
    void applyHtmlToMarkdown().then(() => {
      showNotice('Markdown updated from HTML')
    })
  }, [applyHtmlToMarkdown, showNotice])

  return (
    <div className="split-editor compare-editor" data-testid="compare-editor">
      <div className="split-editor__toolbar">
        <label className="split-editor__sync-toggle">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
          />
          Sync scroll
        </label>
        {hasDiff && (
          <label className="split-editor__sync-toggle">
            <input
              type="checkbox"
              checked={showDiff}
              onChange={(e) => setShowDiff(e.target.checked)}
            />
            Highlight diff
          </label>
        )}
        <button
          type="button"
          className="compare-editor__action"
          disabled={!canSyncHtml}
          title="Discard HTML edits and regenerate from Markdown"
          data-testid="compare-sync-html"
          onClick={handleSyncHtmlFromMarkdown}
        >
          Sync HTML from Markdown
        </button>
        <button
          type="button"
          className="compare-editor__action"
          disabled={!canApplyHtml}
          title="Convert the HTML pane to Markdown (canonical)"
          data-testid="compare-apply-html"
          onClick={handleApplyHtmlToMarkdown}
        >
          Apply HTML to Markdown
        </button>
        <span className="split-editor__hint" data-testid="compare-diff-hint">
          {diffHint}
          {roundTripDrift ? ' · Round-trip would change Markdown' : ''}
        </span>
      </div>
      <div className="split-editor__panes" ref={panesRef}>
        <div
          className="split-editor__pane split-editor__pane--raw"
          style={{ flex: `0 0 ${markdownBasis}` }}
        >
          <div className="compare-editor__label">Markdown</div>
          <RawEditor
            value={value}
            onChange={onChange}
            scrollKey="compare-md"
            editorRef={editorRef}
            onScroll={handleMarkdownScroll}
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
          className="split-editor__pane split-editor__pane--html"
          style={{ flex: `0 0 ${htmlBasis}` }}
        >
          <div className="compare-editor__label">HTML</div>
          {ready ? (
            <HtmlSourceEditor
              value={html}
              onChange={onHtmlChange}
              scrollKey="compare-html"
              editorRef={htmlEditorRef}
              onScroll={handleHtmlScroll}
              extraExtensions={htmlExtraExtensions}
            />
          ) : (
            <div className="mode-loading" role="status">
              Generating HTML…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
