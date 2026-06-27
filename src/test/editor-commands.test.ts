import { describe, expect, it } from 'vitest'
import {
  applyBlockquote,
  applyBold,
  applyCodeBlock,
  applyHeading,
  applyInlineCode,
  applyItalic,
  applyLink,
  applyOrderedList,
  applyUnorderedList,
} from '../editor/editorCommands'

describe('editor commands', () => {
  it('wraps selection in bold', () => {
    const result = applyBold('hello world', { from: 6, to: 11 })
    expect(result.text).toBe('hello **world**')
  })

  it('wraps selection in italic', () => {
    const result = applyItalic('hello world', { from: 6, to: 11 })
    expect(result.text).toBe('hello *world*')
  })

  it('wraps selection in inline code', () => {
    const result = applyInlineCode('hello world', { from: 6, to: 11 })
    expect(result.text).toBe('hello `world`')
  })

  it('prefixes heading on current line', () => {
    const result = applyHeading('hello\nworld', { from: 6, to: 6 })
    expect(result.text).toBe('hello\n# world')
  })

  it('prefixes unordered list', () => {
    const result = applyUnorderedList('item', { from: 0, to: 0 })
    expect(result.text).toBe('- item')
  })

  it('prefixes ordered list', () => {
    const result = applyOrderedList('item', { from: 0, to: 0 })
    expect(result.text).toBe('1. item')
  })

  it('prefixes blockquote', () => {
    const result = applyBlockquote('quote', { from: 0, to: 0 })
    expect(result.text).toBe('> quote')
  })

  it('inserts a link for selection', () => {
    const result = applyLink('click here', { from: 0, to: 5 })
    expect(result.text).toBe('[click](https://example.com) here')
  })

  it('inserts a fenced code block', () => {
    const result = applyCodeBlock('text', { from: 4, to: 4 })
    expect(result.text).toBe('text```\n\n```')
  })
})
