import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

const lightHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#0550ae', fontWeight: '700' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#c2410c', textDecoration: 'underline' },
  { tag: t.url, color: '#c2410c' },
  { tag: t.monospace, color: '#cf222e', fontFamily: 'var(--font-mono)' },
  { tag: t.quote, color: '#57606a', fontStyle: 'italic' },
  { tag: t.list, color: '#24292f' },
  { tag: t.contentSeparator, color: '#57606a' },
])

const darkHighlight = HighlightStyle.define([
  { tag: t.heading, color: '#79c0ff', fontWeight: '700' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: '#e8956a', textDecoration: 'underline' },
  { tag: t.url, color: '#e8956a' },
  { tag: t.monospace, color: '#ff7b72', fontFamily: 'var(--font-mono)' },
  { tag: t.quote, color: '#8b949e', fontStyle: 'italic' },
  { tag: t.list, color: '#e6edf3' },
  { tag: t.contentSeparator, color: '#8b949e' },
])

export function createEditorTheme(isDark: boolean): Extension {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '14px',
        backgroundColor: 'var(--editor-bg)',
        color: 'var(--editor-fg)',
      },
      '.cm-scroller': {
        fontFamily: 'var(--font-mono)',
        lineHeight: '1.65',
      },
      '.cm-content': {
        padding: '16px 0',
        caretColor: 'var(--editor-caret)',
      },
      '.cm-line': {
        padding: '0 4px 0 0',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--editor-gutter-bg)',
        color: 'var(--editor-gutter-fg)',
        border: 'none',
        paddingRight: '4px',
      },
      '.cm-activeLineGutter': {
        color: 'var(--editor-fg)',
      },
      '.cm-activeLine': {
        backgroundColor: 'var(--editor-active-line)',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: 'var(--editor-selection) !important',
      },
      '.cm-cursor': {
        borderLeftColor: 'var(--editor-caret)',
      },
    },
    { dark: isDark },
  )
}

export function createMarkdownHighlighting(isDark: boolean): Extension {
  return syntaxHighlighting(isDark ? darkHighlight : lightHighlight, {
    fallback: true,
  })
}
