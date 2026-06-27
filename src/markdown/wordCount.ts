export function countWords(markdown: string): number {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, ' ')
  const withoutInlineCode = withoutCode.replace(/`[^`]+`/g, ' ')
  const words = withoutInlineCode
    .replace(/[#>*_\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0)
  return words.length
}
