export type LinkedFileFormat = 'markdown' | 'html'

export function detectLinkedFileFormat(filename: string): LinkedFileFormat {
  const name = filename.toLowerCase()
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'html'
  return 'markdown'
}

export function saveFormatLabel(format: LinkedFileFormat): string {
  return format === 'html' ? 'HTML' : 'Markdown'
}
