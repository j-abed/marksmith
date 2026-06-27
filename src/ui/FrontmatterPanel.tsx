import type { FrontmatterFields } from '../markdown/frontmatter'
import {
  formatTagsInput,
  parseFrontmatter,
  parseTagsInput,
} from '../markdown/frontmatter'

type FrontmatterPanelProps = {
  markdown: string
  onApply: (fields: FrontmatterFields) => void
}

export function FrontmatterPanel({ markdown, onApply }: FrontmatterPanelProps) {
  const parsed = parseFrontmatter(markdown)
  const title = parsed.fields.title ?? ''
  const date = parsed.fields.date ?? ''
  const tags = formatTagsInput(parsed.fields.tags)

  return (
    <div className="frontmatter-panel" data-testid="frontmatter-panel">
      <p className="frontmatter-panel__hint">
        YAML header at the top of your Markdown file.
      </p>
      <label className="frontmatter-panel__field">
        <span className="frontmatter-panel__label">Title</span>
        <input
          type="text"
          className="frontmatter-panel__input"
          defaultValue={title}
          key={`title-${title}-${parsed.hasFrontmatter}`}
          data-testid="frontmatter-title"
          onBlur={(event) => {
            const nextTitle = event.target.value.trim()
            if (nextTitle === (parsed.fields.title ?? '')) return
            onApply({
              ...parsed.fields,
              title: nextTitle || undefined,
            })
          }}
        />
      </label>
      <label className="frontmatter-panel__field">
        <span className="frontmatter-panel__label">Date</span>
        <input
          type="date"
          className="frontmatter-panel__input"
          defaultValue={date}
          key={`date-${date}-${parsed.hasFrontmatter}`}
          data-testid="frontmatter-date"
          onBlur={(event) => {
            const nextDate = event.target.value
            if (nextDate === (parsed.fields.date ?? '')) return
            onApply({
              ...parsed.fields,
              date: nextDate || undefined,
            })
          }}
        />
      </label>
      <label className="frontmatter-panel__field">
        <span className="frontmatter-panel__label">Tags</span>
        <input
          type="text"
          className="frontmatter-panel__input"
          defaultValue={tags}
          key={`tags-${tags}-${parsed.hasFrontmatter}`}
          placeholder="local-first, docs"
          data-testid="frontmatter-tags"
          onBlur={(event) => {
            const nextTags = parseTagsInput(event.target.value)
            const current = parsed.fields.tags
            if (
              nextTags.length === current.length &&
              nextTags.every((tag, index) => tag === current[index])
            ) {
              return
            }
            onApply({
              ...parsed.fields,
              tags: nextTags,
            })
          }}
        />
      </label>
    </div>
  )
}
