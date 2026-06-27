import { describe, expect, it } from 'vitest'
import {
  applyFrontmatter,
  parseFrontmatter,
  parseTagsInput,
} from '../markdown/frontmatter'

const SAMPLE = `---
title: Project Brief
date: 2026-06-26
tags:
  - local-first
  - markdown
---

# Project Brief

Body text.
`

describe('frontmatter', () => {
  it('parses yaml header fields', () => {
    const parsed = parseFrontmatter(SAMPLE)
    expect(parsed.hasFrontmatter).toBe(true)
    expect(parsed.fields.title).toBe('Project Brief')
    expect(parsed.fields.date).toBe('2026-06-26')
    expect(parsed.fields.tags).toEqual(['local-first', 'markdown'])
    expect(parsed.body.trimStart()).toMatch(/^# Project Brief/)
  })

  it('applies updated fields to markdown', () => {
    const next = applyFrontmatter('# Hello\n\nBody', {
      title: 'Hello',
      date: '2026-06-26',
      tags: ['docs'],
    })
    expect(next).toContain('title: Hello')
    expect(next).toContain('date: 2026-06-26')
    expect(next).toContain('- docs')
    expect(next).toMatch(/---\n[\s\S]+\n---\n\n# Hello/)
  })

  it('removes frontmatter when all fields are cleared', () => {
    const parsed = parseFrontmatter(SAMPLE)
    const next = applyFrontmatter(SAMPLE, {
      tags: [],
    })
    expect(next).toBe(parsed.body.trimStart())
  })

  it('parses comma-separated tags input', () => {
    expect(parseTagsInput('one, two, three')).toEqual(['one', 'two', 'three'])
  })
})
