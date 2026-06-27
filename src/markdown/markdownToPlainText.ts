/**
 * Strip Markdown syntax to readable plain text.
 */
export function markdownToPlainText(markdown: string): string {
  let text = markdown

  // Fenced code blocks — keep inner content
  text = text.replace(/```[\w-]*\n?([\s\S]*?)```/g, (_, code: string) =>
    code.trim(),
  )

  // Inline code
  text = text.replace(/`([^`]+)`/g, '$1')

  // Images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')

  // Links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Headings
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Blockquotes
  text = text.replace(/^>\s?/gm, '')

  // Bold / italic
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')

  // Unordered lists
  text = text.replace(/^[-*+]\s+/gm, '• ')

  // Ordered lists
  text = text.replace(/^\d+\.\s+/gm, '')

  // Task lists
  text = text.replace(/^-\s+\[[ xX]\]\s+/gm, '• ')

  // Horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '')

  // Collapse excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}
