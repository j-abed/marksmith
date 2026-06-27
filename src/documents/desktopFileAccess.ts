import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { basename } from '@tauri-apps/api/path'
import { buildExportContent, safeExportBasename } from './exportDocument'
import { titleFromFilename } from './fileAccess'
import {
  detectLinkedFileFormat,
  type LinkedFileFormat,
} from './linkedFileFormat'
import { normalizeImportedContent } from '../markdown/importContent'
import { isTauri } from '../platform/desktop'

export type DesktopOpenedFile = {
  title: string
  markdown: string
  path: string
  sourceName: string
  convertedFromHtml: boolean
  format: LinkedFileFormat
}

function pathToSourceName(path: string): string {
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1] ?? path
}

export async function openDocumentFromPath(
  path: string,
): Promise<DesktopOpenedFile> {
  const raw = await readTextFile(path)
  const { markdown, convertedFromHtml } = await normalizeImportedContent(raw)
  const sourceName = pathToSourceName(path)
  return {
    title: titleFromFilename(sourceName),
    markdown,
    path,
    sourceName,
    convertedFromHtml,
    format: detectLinkedFileFormat(sourceName),
  }
}

export async function openDocumentWithDesktopDialog(): Promise<DesktopOpenedFile | null> {
  if (!isTauri()) return null

  const selected = await open({
    multiple: false,
    filters: [
      {
        name: 'Documents',
        extensions: ['md', 'markdown', 'txt', 'html', 'htm'],
      },
    ],
  })

  if (!selected || Array.isArray(selected)) return null
  return openDocumentFromPath(selected)
}

export async function saveDesktopLinkedFile(
  path: string,
  title: string,
  markdown: string,
  format: LinkedFileFormat,
): Promise<void> {
  if (format === 'html') {
    const { content } = await buildExportContent(title, markdown, 'html')
    await writeTextFile(path, content)
    return
  }
  await writeTextFile(path, markdown)
}

export async function saveMarkdownAsWithDesktopDialog(
  title: string,
  markdown: string,
): Promise<string | null> {
  const path = await save({
    defaultPath: `${safeExportBasename(title)}.md`,
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  })
  if (!path) return null
  await writeTextFile(path, markdown)
  return path
}

export async function saveHtmlAsWithDesktopDialog(
  title: string,
  markdown: string,
): Promise<string | null> {
  const { filename, content } = await buildExportContent(title, markdown, 'html')
  const path = await save({
    defaultPath: filename,
    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
  })
  if (!path) return null
  await writeTextFile(path, content)
  return path
}

export async function desktopSourceName(path: string): Promise<string> {
  try {
    return await basename(path)
  } catch {
    return pathToSourceName(path)
  }
}
