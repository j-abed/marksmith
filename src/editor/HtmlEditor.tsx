import type { RefObject } from 'react'
import type { Extension } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { HtmlSourceEditor } from './HtmlSourceEditor'
import { useHtmlMarkdownSync } from './useHtmlMarkdownSync'

type HtmlEditorProps = {
  value: string
  onChange: (value: string) => void
  appKeymap?: Extension
  editorRef?: RefObject<EditorView | null>
}

export function HtmlEditor({
  value,
  onChange,
  appKeymap,
  editorRef,
}: HtmlEditorProps) {
  const { html, onHtmlChange, ready } = useHtmlMarkdownSync(value, onChange)

  return (
    <div className="html-editor" data-testid="html-editor">
      <div className="html-editor__toolbar">
        <span className="html-editor__hint">
          Edit rendered HTML — changes sync to Markdown on save
        </span>
      </div>
      {ready ? (
        <HtmlSourceEditor
          value={html}
          onChange={onHtmlChange}
          scrollKey="html"
          editorRef={editorRef}
          appKeymap={appKeymap}
        />
      ) : (
        <div className="mode-loading" role="status">
          Generating HTML…
        </div>
      )}
    </div>
  )
}
