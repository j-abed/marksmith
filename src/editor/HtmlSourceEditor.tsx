import { useEffect, useRef, type RefObject } from 'react'
import { EditorState, type Extension } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { html } from '@codemirror/lang-html'
import { search, searchKeymap } from '@codemirror/search'
import { createEditorTheme } from './editorTheme'

type HtmlSourceEditorProps = {
  value: string
  onChange: (value: string) => void
  showLineNumbers?: boolean
  extraExtensions?: Extension[]
  appKeymap?: Extension
  editorRef?: RefObject<EditorView | null>
  scrollKey?: string
  onScroll?: (view: EditorView) => void
}

export function HtmlSourceEditor({
  value,
  onChange,
  showLineNumbers = true,
  extraExtensions = [],
  appKeymap,
  editorRef,
  scrollKey,
  onScroll,
}: HtmlSourceEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onScrollRef = useRef(onScroll)
  const lastEmitted = useRef(value)
  const scrollPositions = useRef(new Map<string, number>())
  const isDark =
    document.documentElement.dataset.theme === 'dark'

  onChangeRef.current = onChange
  onScrollRef.current = onScroll

  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const next = update.state.doc.toString()
        if (next !== lastEmitted.current) {
          lastEmitted.current = next
          onChangeRef.current(next)
        }
      }
      if (scrollKey && update.view) {
        scrollPositions.current.set(scrollKey, update.view.scrollDOM.scrollTop)
      }
    })

    const extensions: Extension[] = [
      history(),
      drawSelection(),
      highlightActiveLine(),
      html(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      search({ top: true }),
      createEditorTheme(isDark),
      updateListener,
      EditorView.lineWrapping,
      ...extraExtensions,
    ]

    if (appKeymap) {
      extensions.push(appKeymap)
    }

    if (showLineNumbers) {
      extensions.push(lineNumbers())
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view
    if (editorRef) editorRef.current = view

    const handleScroll = () => {
      onScrollRef.current?.(view)
    }
    view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true })

    if (scrollKey) {
      const saved = scrollPositions.current.get(scrollKey)
      if (saved !== undefined) {
        view.scrollDOM.scrollTop = saved
      }
    }

    return () => {
      view.scrollDOM.removeEventListener('scroll', handleScroll)
      if (scrollKey && viewRef.current) {
        scrollPositions.current.set(
          scrollKey,
          viewRef.current.scrollDOM.scrollTop,
        )
      }
      view.destroy()
      viewRef.current = null
      if (editorRef) editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLineNumbers, scrollKey, isDark, extraExtensions])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      lastEmitted.current = value
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return <div ref={containerRef} className="html-source-editor" />
}
