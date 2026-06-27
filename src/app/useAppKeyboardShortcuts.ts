import { useEffect, useRef, type RefObject } from 'react'
import type { EditorView } from '@codemirror/view'
import { useApp } from './AppProvider'
import {
  handleAppKeyboardEvent,
  type AppKeyboardHandlers,
} from './keyboardShortcuts'

export function useAppKeyboardShortcuts(
  editorRef: RefObject<EditorView | null>,
  openFind: () => void,
  openReplace: () => void,
  openShortcutsHelp: () => void,
) {
  const {
    state,
    setMarkdown,
    toggleZenMode,
    newDocument,
    openFileFromInput,
    saveFile,
    saveFileAs,
    canSaveToDisk,
    showNotice,
  } = useApp()

  const openFindRef = useRef(openFind)
  const openReplaceRef = useRef(openReplace)
  const openShortcutsHelpRef = useRef(openShortcutsHelp)
  openFindRef.current = openFind
  openReplaceRef.current = openReplace
  openShortcutsHelpRef.current = openShortcutsHelp

  const handlersRef = useRef<AppKeyboardHandlers>({
    zenMode: false,
    mode: 'raw',
    canSaveToDisk: false,
    markdown: '',
    newDocument,
    openFileFromInput,
    openFind: () => openFindRef.current(),
    openReplace: () => openReplaceRef.current(),
    openShortcutsHelp: () => openShortcutsHelpRef.current(),
    saveFile,
    saveFileAs,
    toggleZenMode,
    setMarkdown,
    notify: showNotice,
    getEditorView: () => editorRef.current,
  })

  handlersRef.current = {
    zenMode: state.zenMode,
    mode: state.mode,
    canSaveToDisk,
    markdown: state.document.markdown,
    newDocument,
    openFileFromInput,
    openFind: () => openFindRef.current(),
    openReplace: () => openReplaceRef.current(),
    openShortcutsHelp: () => openShortcutsHelpRef.current(),
    saveFile,
    saveFileAs,
    toggleZenMode,
    setMarkdown,
    notify: showNotice,
    getEditorView: () => editorRef.current,
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      handleAppKeyboardEvent(event, handlersRef.current)
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [])

  return handlersRef
}
