export type TextRange = { from: number; to: number }

export function getLineRange(
  text: string,
  position: number,
): { lineStart: number; lineEnd: number; lineText: string } {
  const lineStart = text.lastIndexOf('\n', position - 1) + 1
  const nextNewline = text.indexOf('\n', position)
  const lineEnd = nextNewline === -1 ? text.length : nextNewline
  return {
    lineStart,
    lineEnd,
    lineText: text.slice(lineStart, lineEnd),
  }
}

export function wrapSelection(
  text: string,
  range: TextRange,
  before: string,
  after: string,
): { text: string; range: TextRange } {
  const selected = text.slice(range.from, range.to)
  const wrapped = `${before}${selected || 'text'}${after}`
  const nextText =
    text.slice(0, range.from) + wrapped + text.slice(range.to)
  const cursorStart = range.from + before.length
  const cursorEnd = cursorStart + (selected || 'text').length
  return { text: nextText, range: { from: cursorStart, to: cursorEnd } }
}

export function toggleWrap(
  text: string,
  range: TextRange,
  before: string,
  after: string,
): { text: string; range: TextRange } {
  const selected = text.slice(range.from, range.to)
  if (
    selected.startsWith(before) &&
    selected.endsWith(after) &&
    selected.length >= before.length + after.length
  ) {
    const inner = selected.slice(before.length, selected.length - after.length)
    const nextText =
      text.slice(0, range.from) + inner + text.slice(range.to)
    return {
      text: nextText,
      range: { from: range.from, to: range.from + inner.length },
    }
  }
  return wrapSelection(text, range, before, after)
}

export function applyBold(text: string, range: TextRange) {
  return toggleWrap(text, range, '**', '**')
}

export function applyItalic(text: string, range: TextRange) {
  return toggleWrap(text, range, '*', '*')
}

export function applyInlineCode(text: string, range: TextRange) {
  return toggleWrap(text, range, '`', '`')
}

export function applyHeading(text: string, range: TextRange): {
  text: string
  range: TextRange
} {
  const { lineStart, lineEnd, lineText } = getLineRange(text, range.from)
  const match = /^(#{1,6})\s/.exec(lineText)
  let prefix = '# '
  if (match) {
    const level = match[1]!.length
    prefix = level >= 6 ? '# ' : `${'#'.repeat(level + 1)} `
  }
  const stripped = lineText.replace(/^#{1,6}\s*/, '')
  const nextLine = `${prefix}${stripped}`
  const nextText = text.slice(0, lineStart) + nextLine + text.slice(lineEnd)
  return {
    text: nextText,
    range: { from: lineStart, to: lineStart + nextLine.length },
  }
}

export function applyLinePrefix(
  text: string,
  range: TextRange,
  prefix: string,
): { text: string; range: TextRange } {
  const { lineStart, lineEnd, lineText } = getLineRange(text, range.from)
  const stripped = lineText.replace(
    new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    '',
  )
  const alreadyPrefixed = lineText.startsWith(prefix)
  const nextLine = alreadyPrefixed ? stripped : `${prefix}${lineText}`
  const nextText = text.slice(0, lineStart) + nextLine + text.slice(lineEnd)
  const delta = nextLine.length - lineText.length
  return {
    text: nextText,
    range: {
      from: Math.min(range.from + (alreadyPrefixed ? -prefix.length : prefix.length), lineStart + nextLine.length),
      to: Math.min(range.to + delta, lineStart + nextLine.length),
    },
  }
}

export function applyUnorderedList(text: string, range: TextRange) {
  return applyLinePrefix(text, range, '- ')
}

export function applyOrderedList(text: string, range: TextRange) {
  return applyLinePrefix(text, range, '1. ')
}

export function applyBlockquote(text: string, range: TextRange) {
  return applyLinePrefix(text, range, '> ')
}

export function applyLink(text: string, range: TextRange) {
  const selected = text.slice(range.from, range.to) || 'link text'
  const link = `[${selected}](https://example.com)`
  const nextText = text.slice(0, range.from) + link + text.slice(range.to)
  const urlStart = range.from + selected.length + 3
  return {
    text: nextText,
    range: { from: urlStart, to: urlStart + 'https://example.com'.length },
  }
}

export function applyCodeBlock(text: string, range: TextRange) {
  const block = '```\n\n```'
  const nextText = text.slice(0, range.from) + block + text.slice(range.to)
  const cursor = range.from + 4
  return { text: nextText, range: { from: cursor, to: cursor } }
}
