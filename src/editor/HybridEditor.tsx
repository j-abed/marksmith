import type { RefObject } from 'react'
import { RawEditor } from './RawEditor'
import { hybridDecorations } from './hybridDecorations'
import type { EditorView } from '@codemirror/view'

const hybridExtensions = [hybridDecorations]

type HybridEditorProps = {
  value: string
  onChange: (value: string) => void
  editorRef?: RefObject<EditorView | null>
  appKeymap?: import('@codemirror/state').Extension
}

export function HybridEditor({
  value,
  onChange,
  editorRef,
  appKeymap,
}: HybridEditorProps) {
  return (
    <div className="hybrid-editor">
      <RawEditor
        value={value}
        onChange={onChange}
        scrollKey="hybrid"
        extraExtensions={hybridExtensions}
        editorRef={editorRef}
        appKeymap={appKeymap}
      />
    </div>
  )
}
