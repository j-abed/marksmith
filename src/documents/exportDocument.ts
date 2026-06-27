import { renderMarkdownToHtml } from '../markdown/renderMarkdown'
import { markdownToPlainText } from '../markdown/markdownToPlainText'

export type ExportFormat = 'md' | 'html' | 'txt' | 'json'

export type ExportFormatOption = {
  id: ExportFormat
  label: string
  extension: string
  description: string
}

export const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    id: 'md',
    label: 'Markdown',
    extension: '.md',
    description: 'Canonical source (.md)',
  },
  {
    id: 'html',
    label: 'HTML',
    extension: '.html',
    description: 'Sanitized standalone page',
  },
  {
    id: 'txt',
    label: 'Plain text',
    extension: '.txt',
    description: 'Markdown syntax removed',
  },
  {
    id: 'json',
    label: 'JSON',
    extension: '.json',
    description: 'Title and content backup',
  },
]

export function safeExportBasename(title: string): string {
  const trimmed = title.trim() || 'untitled'
  const slug = trimmed.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return slug.toLowerCase() || 'untitled'
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function wrapHtmlDocument(title: string, bodyHtml: string): string {
  const safeTitle = title.trim() || 'Untitled'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(safeTitle)}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.7;
      color: #24292f;
      background: #fff;
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    pre {
      overflow-x: auto;
      padding: 14px 16px;
      border-radius: 6px;
      border: 1px solid #d0d7de;
      background: #f6f8fa;
    }
    code {
      font-family: ui-monospace, monospace;
      font-size: 0.875em;
      background: #eff1f3;
      padding: 0.15em 0.35em;
      border-radius: 4px;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      margin: 1em 0;
      padding-left: 1em;
      border-left: 3px solid #d0d7de;
      color: #57606a;
    }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #d0d7de; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    a { color: #c2410c; }
    hr { border: none; border-top: 1px solid #d0d7de; margin: 1.5em 0; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>
`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function buildExportContent(
  title: string,
  markdown: string,
  format: ExportFormat,
): Promise<{ filename: string; content: string; mimeType: string }> {
  const base = safeExportBasename(title)

  switch (format) {
    case 'md':
      return {
        filename: `${base}.md`,
        content: markdown,
        mimeType: 'text/markdown',
      }
    case 'html': {
      const body = await renderMarkdownToHtml(markdown)
      return {
        filename: `${base}.html`,
        content: wrapHtmlDocument(title, body),
        mimeType: 'text/html',
      }
    }
    case 'txt':
      return {
        filename: `${base}.txt`,
        content: markdownToPlainText(markdown),
        mimeType: 'text/plain',
      }
    case 'json':
      return {
        filename: `${base}.json`,
        content: JSON.stringify(
          {
            title: title.trim() || 'Untitled',
            markdown,
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        mimeType: 'application/json',
      }
    default: {
      const _exhaustive: never = format
      return _exhaustive
    }
  }
}

export async function exportDocument(
  title: string,
  markdown: string,
  format: ExportFormat,
): Promise<void> {
  const { filename, content, mimeType } = await buildExportContent(
    title,
    markdown,
    format,
  )
  downloadTextFile(filename, content, mimeType)
}

/** @deprecated Use exportDocument with format 'md' */
export function exportMarkdownFile(title: string, markdown: string): void {
  void exportDocument(title, markdown, 'md')
}
