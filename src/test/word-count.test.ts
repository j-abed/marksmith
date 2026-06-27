import { describe, expect, it } from 'vitest'
import { countWords } from '../markdown/wordCount'

describe('word count', () => {
  it('counts words in plain markdown', () => {
    expect(countWords('hello world')).toBe(2)
  })

  it('ignores fenced code block contents', () => {
    const md = 'one two\n```\nmany words in code\n```\nthree'
    expect(countWords(md)).toBe(3)
  })

  it('returns zero for empty input', () => {
    expect(countWords('')).toBe(0)
  })
})
