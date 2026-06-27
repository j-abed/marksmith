export type FrontmatterFields = {
  title?: string
  tags: string[]
  date?: string
}

export type ParsedFrontmatter = {
  fields: FrontmatterFields
  body: string
  hasFrontmatter: boolean
}

const FRONTMATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

function unquote(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseTagsValue(raw: string): string[] {
  const value = raw.trim()
  if (!value) return []

  const inlineList = value.match(/^\[(.*)\]$/)
  if (inlineList) {
    const inner = inlineList[1]?.trim()
    if (!inner) return []
    return inner
      .split(',')
      .map((tag) => unquote(tag.trim()))
      .filter(Boolean)
  }

  if (value.includes(',')) {
    return value
      .split(',')
      .map((tag) => unquote(tag.trim()))
      .filter(Boolean)
  }

  return [unquote(value)]
}

function parseYamlBlock(yaml: string): FrontmatterFields {
  const fields: FrontmatterFields = { tags: [] }
  const lines = yaml.replace(/\r\n/g, '\n').split('\n')
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index++
      continue
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!keyMatch) {
      index++
      continue
    }

    const key = keyMatch[1]
    const inlineValue = keyMatch[2] ?? ''

    if (key === 'tags' && !inlineValue) {
      const tags: string[] = []
      index++
      while (index < lines.length) {
        const listLine = lines[index]
        const listMatch = listLine.match(/^\s*-\s+(.+)$/)
        if (!listMatch) break
        tags.push(unquote(listMatch[1] ?? ''))
        index++
      }
      fields.tags = tags.filter(Boolean)
      continue
    }

    if (key === 'title') {
      fields.title = unquote(inlineValue)
    } else if (key === 'date') {
      fields.date = unquote(inlineValue)
    } else if (key === 'tags') {
      fields.tags = parseTagsValue(inlineValue)
    }

    index++
  }

  return fields
}

function quoteYamlValue(value: string): string {
  if (/[:#[\]{}&,*?|>!%@`"'\\]/.test(value) || value.includes('\n')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return value
}

function serializeYamlBlock(fields: FrontmatterFields): string {
  const lines: string[] = []
  if (fields.title?.trim()) {
    lines.push(`title: ${quoteYamlValue(fields.title.trim())}`)
  }
  if (fields.date?.trim()) {
    lines.push(`date: ${fields.date.trim()}`)
  }
  if (fields.tags.length > 0) {
    lines.push('tags:')
    for (const tag of fields.tags) {
      lines.push(`  - ${quoteYamlValue(tag)}`)
    }
  }
  return lines.join('\n')
}

export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const match = markdown.match(FRONTMATTER_RE)
  if (!match) {
    return {
      fields: { tags: [] },
      body: markdown,
      hasFrontmatter: false,
    }
  }

  return {
    fields: parseYamlBlock(match[1] ?? ''),
    body: markdown.slice(match[0].length),
    hasFrontmatter: true,
  }
}

export function hasFrontmatterContent(fields: FrontmatterFields): boolean {
  return Boolean(fields.title?.trim() || fields.date?.trim() || fields.tags.length > 0)
}

export function applyFrontmatter(
  markdown: string,
  fields: FrontmatterFields,
): string {
  const { body } = parseFrontmatter(markdown)
  const normalizedBody = body.replace(/^\n+/, '')

  if (!hasFrontmatterContent(fields)) {
    return normalizedBody
  }

  const yaml = serializeYamlBlock({
    title: fields.title?.trim() || undefined,
    date: fields.date?.trim() || undefined,
    tags: fields.tags.map((tag) => tag.trim()).filter(Boolean),
  })

  return `---\n${yaml}\n---\n\n${normalizedBody}`
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(', ')
}

export function parseTagsInput(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/** Prefer YAML `title` when present; otherwise use the supplied fallback. */
export function resolveDocumentTitle(
  markdown: string,
  fallbackTitle: string,
): string {
  const fmTitle = parseFrontmatter(markdown).fields.title?.trim()
  return fmTitle || fallbackTitle.trim() || 'Untitled'
}

/** Update `title:` in an existing frontmatter block; no-op if the doc has no YAML header. */
export function setFrontmatterTitle(markdown: string, title: string): string {
  const parsed = parseFrontmatter(markdown)
  if (!parsed.hasFrontmatter) return markdown
  return applyFrontmatter(markdown, {
    ...parsed.fields,
    title: title.trim() || undefined,
  })
}

export function documentHasFrontmatterMetadata(markdown: string): boolean {
  const parsed = parseFrontmatter(markdown)
  return parsed.hasFrontmatter && hasFrontmatterContent(parsed.fields)
}
