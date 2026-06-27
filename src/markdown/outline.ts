export type OutlineHeading = {
  level: number
  text: string
  line: number
}

export function extractOutline(markdown: string): OutlineHeading[] {
  const headings: OutlineHeading[] = []
  const lines = markdown.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{1,6})\s+(.+)$/.exec(lines[i] ?? '')
    if (!match) continue
    headings.push({
      level: match[1]!.length,
      text: match[2]!.replace(/[#*_`[\]]/g, '').trim(),
      line: i + 1,
    })
  }

  return headings
}
