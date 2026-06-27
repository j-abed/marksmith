import { describe, expect, it } from 'vitest'
import {
  computeCompareDiff,
  computeDiffLineIndices,
  formatCompareDiffHint,
  normalizeCompareText,
  textsEqual,
} from '../editor/compareDiff'

describe('compareDiff', () => {
  it('finds differing line indices', () => {
    const expected = '<h1>Title</h1>\n<p>One</p>'
    const actual = '<h1>Title</h1>\n<p>Two</p>\n<p>Extra</p>'
    expect(computeDiffLineIndices(expected, actual)).toEqual([1, 2])
  })

  it('returns empty when texts match line-for-line', () => {
    const html = '<p>Same</p>\n<p>Lines</p>'
    expect(computeDiffLineIndices(html, html)).toEqual([])
  })

  it('compares normalized text', () => {
    expect(textsEqual('  hello  ', 'hello')).toBe(true)
    expect(textsEqual('hello', 'world')).toBe(false)
    expect(normalizeCompareText('a\r\nb')).toBe('a\nb')
  })

  it('uses word spans for single-line edits', () => {
    const expected = '<p>Hello world</p>'
    const actual = '<p>Hello Marksmith</p>'
    const diff = computeCompareDiff(expected, actual)
    expect(diff.fullLines).toEqual([])
    expect(diff.touchedLines).toEqual([0])
    expect(diff.wordSpans).toHaveLength(1)
    const span = diff.wordSpans[0]!
    expect(actual.slice(span.from, span.to)).toContain('Marksmith')
  })

  it('highlights inserted lines in full', () => {
    const expected = '<p>One</p>'
    const actual = '<p>One</p>\n<p>Two</p>'
    const diff = computeCompareDiff(expected, actual)
    expect(diff.fullLines).toEqual([1])
    expect(diff.wordSpans).toEqual([])
    expect(diff.touchedLines).toEqual([1])
  })

  it('formats hint for word-level diffs', () => {
    const diff = computeCompareDiff(
      '<p>Hello world</p>',
      '<p>Hello Marksmith</p>',
    )
    expect(formatCompareDiffHint(diff)).toBe(
      '1 word differs on 1 HTML line',
    )
  })

  it('formats hint for inserted lines', () => {
    const diff = computeCompareDiff('<p>One</p>', '<p>One</p>\n<p>Two</p>')
    expect(formatCompareDiffHint(diff)).toBe(
      '1 HTML line differs from Markdown render',
    )
  })

  it('merges delete+insert into change alignment', () => {
    const expected = '<p>Alpha</p>'
    const actual = '<p>Beta</p>'
    const diff = computeCompareDiff(expected, actual)
    expect(diff.touchedLines).toEqual([0])
    expect(diff.fullLines).toEqual([])
    expect(diff.wordSpans.length).toBeGreaterThan(0)
  })
})
