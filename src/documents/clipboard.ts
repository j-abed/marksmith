import { normalizeImportedContent } from '../markdown/importContent'
import { renderMarkdownToHtml } from '../markdown/renderMarkdown'

export class ClipboardError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClipboardError'
  }
}

export type ClipboardContent = {
  text: string
  convertedFromHtml: boolean
}

function fallbackCopyText(text: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!ok) {
    throw new ClipboardError('Copy failed. Check browser clipboard permissions.')
  }
}

export async function copyMarkdownToClipboard(markdown: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown)
      return
    }
  } catch {
    // fall through to legacy copy
  }
  fallbackCopyText(markdown)
}

export async function copySanitizedHtmlToClipboard(
  markdown: string,
): Promise<void> {
  const html = await renderMarkdownToHtml(markdown)

  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([markdown], { type: 'text/plain' }),
        }),
      ])
      return
    }
  } catch {
    // fall through
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(html)
      return
    }
  } catch {
    // fall through
  }

  fallbackCopyText(html)
}

export async function readMarkdownFromClipboard(): Promise<string> {
  const result = await readContentFromClipboard()
  return result.text
}

export async function readContentFromClipboard(): Promise<ClipboardContent> {
  try {
    if (navigator.clipboard?.read) {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html')
          const html = await blob.text()
          const normalized = await normalizeImportedContent(html)
          if (normalized.convertedFromHtml) {
            return {
              text: normalized.markdown,
              convertedFromHtml: true,
            }
          }
        }
      }
    }
  } catch {
    // fall through to plain text
  }

  try {
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText()
      const normalized = await normalizeImportedContent(text)
      return {
        text: normalized.markdown,
        convertedFromHtml: normalized.convertedFromHtml,
      }
    }
  } catch (err) {
    throw new ClipboardError(
      err instanceof Error
        ? err.message
        : 'Paste failed. Grant clipboard permission and try again.',
    )
  }

  throw new ClipboardError('Clipboard read is not supported in this browser.')
}

export function pasteTextAtSelection(
  text: string,
  current: string,
  selection: { from: number; to: number },
): { text: string; selection: { from: number; to: number } } {
  const next =
    current.slice(0, selection.from) +
    text +
    current.slice(selection.to)
  const cursor = selection.from + text.length
  return { text: next, selection: { from: cursor, to: cursor } }
}
