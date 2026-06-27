import {
  buildExportContent,
  downloadTextFile,
  safeExportBasename,
} from './exportDocument'
import {
  importNotice,
  normalizeImportedContent,
} from '../markdown/importContent'

export type OpenedFile = {
  title: string
  markdown: string
  handle: FileSystemFileHandle | null
  convertedFromHtml: boolean
}

export function titleFromFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name
  const withoutExt = base.replace(/\.(md|markdown|txt|html|htm)$/i, '')
  return withoutExt.trim() || 'Untitled'
}

export function isSupportedDocumentFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    name.endsWith('.md') ||
    name.endsWith('.markdown') ||
    name.endsWith('.txt') ||
    name.endsWith('.html') ||
    name.endsWith('.htm') ||
    file.type === 'text/markdown' ||
    file.type === 'text/plain' ||
    file.type === 'text/html'
  )
}

/** @deprecated Use isSupportedDocumentFile */
export const isMarkdownFile = isSupportedDocumentFile

export function supportsFileSystemAccess(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    'showSaveFilePicker' in window
  )
}

async function readFileAsText(file: File): Promise<string> {
  return file.text()
}

async function writeHandle(
  handle: FileSystemFileHandle,
  content: string,
): Promise<void> {
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

export async function openMarkdownWithPicker(): Promise<OpenedFile | null> {
  if (supportsFileSystemAccess() && window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: 'Documents',
          accept: {
            'text/markdown': ['.md', '.markdown'],
            'text/plain': ['.txt'],
            'text/html': ['.html', '.htm'],
          },
        },
      ],
    })
    return readDocumentFile(await handle.getFile(), handle)
  }
  return null
}

export async function readDocumentFile(
  file: File,
  handle: FileSystemFileHandle | null = null,
): Promise<OpenedFile> {
  const raw = await readFileAsText(file)
  const { markdown, convertedFromHtml } = await normalizeImportedContent(raw)
  return {
    title: titleFromFilename(file.name),
    markdown,
    handle,
    convertedFromHtml,
  }
}

/** @deprecated Use readDocumentFile */
export async function readMarkdownFile(file: File): Promise<OpenedFile> {
  return readDocumentFile(file)
}

export async function saveMarkdownWithPicker(
  title: string,
  markdown: string,
  existingHandle?: FileSystemFileHandle | null,
): Promise<FileSystemFileHandle | null> {
  if (existingHandle) {
    await writeHandle(existingHandle, markdown)
    return existingHandle
  }

  if (supportsFileSystemAccess() && window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: `${safeExportBasename(title)}.md`,
      types: [
        {
          description: 'Markdown',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    })
    await writeHandle(handle, markdown)
    return handle
  }

  downloadTextFile(`${safeExportBasename(title)}.md`, markdown, 'text/markdown')
  return null
}

export async function saveMarkdownAsWithPicker(
  title: string,
  markdown: string,
): Promise<FileSystemFileHandle | null> {
  if (supportsFileSystemAccess() && window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: `${safeExportBasename(title)}.md`,
      types: [
        {
          description: 'Markdown',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    })
    await writeHandle(handle, markdown)
    return handle
  }

  downloadTextFile(`${safeExportBasename(title)}.md`, markdown, 'text/markdown')
  return null
}

export async function saveHtmlAsWithPicker(
  title: string,
  markdown: string,
): Promise<FileSystemFileHandle | null> {
  const { filename, content, mimeType } = await buildExportContent(
    title,
    markdown,
    'html',
  )

  if (supportsFileSystemAccess() && window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'HTML',
          accept: { 'text/html': ['.html', '.htm'] },
        },
      ],
    })
    await writeHandle(handle, content)
    return handle
  }

  downloadTextFile(filename, content, mimeType)
  return null
}

export { importNotice }
