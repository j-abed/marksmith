export function isLikelyHtml(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  if (/^<!DOCTYPE html\b/i.test(trimmed)) return true
  if (/^<html[\s>]/i.test(trimmed)) return true

  const blockTagPattern =
    /<(p|div|h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre|code|section|article|main|header|footer|figure|hr|br)\b/i

  if (/^\s*</.test(trimmed) && blockTagPattern.test(trimmed)) {
    return true
  }

  const tags = trimmed.match(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi) ?? []
  if (tags.length < 2) return false

  let blockTags = 0
  for (const tag of tags) {
    const name = tag.match(/<\/?([a-z][a-z0-9]*)/i)?.[1]?.toLowerCase()
    if (
      name &&
      [
        'p',
        'div',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'table',
        'blockquote',
        'pre',
        'section',
        'article',
      ].includes(name)
    ) {
      blockTags++
    }
  }

  return blockTags >= 2
}
