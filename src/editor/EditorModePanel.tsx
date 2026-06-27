import { Suspense, lazy, useEffect, type RefObject } from 'react'
import type { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import type { EditorMode } from '../app/appState'
import { RawEditor } from './RawEditor'
import { preloadEditorMode } from './modePreload'

const PreviewPane = lazy(() =>
  import('./PreviewPane').then((module) => ({ default: module.PreviewPane })),
)

const SplitEditor = lazy(() =>
  import('./SplitEditor').then((module) => ({ default: module.SplitEditor })),
)

const HybridEditor = lazy(() =>
  import('./HybridEditor').then((module) => ({ default: module.HybridEditor })),
)

const HtmlEditor = lazy(() =>
  import('./HtmlEditor').then((module) => ({ default: module.HtmlEditor })),
)

const CompareEditor = lazy(() =>
  import('./CompareEditor').then((module) => ({ default: module.CompareEditor })),
)

type EditorModePanelProps = {
  mode: EditorMode
  markdown: string
  onChange: (value: string) => void
  editorRef: RefObject<EditorView | null>
  appKeymap: Extension
}

function ModeLoadingFallback() {
  return (
    <div className="mode-loading" role="status" aria-live="polite">
      Loading editor…
    </div>
  )
}

export function EditorModePanel({
  mode,
  markdown,
  onChange,
  editorRef,
  appKeymap,
}: EditorModePanelProps) {
  useEffect(() => {
    preloadEditorMode(mode)
  }, [mode])

  if (mode === 'raw') {
    return (
      <RawEditor
        value={markdown}
        onChange={onChange}
        editorRef={editorRef}
        scrollKey="raw"
        appKeymap={appKeymap}
      />
    )
  }

  return (
    <Suspense fallback={<ModeLoadingFallback />}>
      {mode === 'preview' && <PreviewPane markdown={markdown} />}
      {mode === 'split' && (
        <SplitEditor
          value={markdown}
          onChange={onChange}
          appKeymap={appKeymap}
          editorRef={editorRef}
        />
      )}
      {mode === 'hybrid' && (
        <HybridEditor
          value={markdown}
          onChange={onChange}
          editorRef={editorRef}
          appKeymap={appKeymap}
        />
      )}
      {mode === 'html' && (
        <HtmlEditor
          value={markdown}
          onChange={onChange}
          editorRef={editorRef}
          appKeymap={appKeymap}
        />
      )}
      {mode === 'compare' && (
        <CompareEditor
          value={markdown}
          onChange={onChange}
          editorRef={editorRef}
          appKeymap={appKeymap}
        />
      )}
    </Suspense>
  )
}
