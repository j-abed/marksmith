import { describe, expect, it } from 'vitest'
import {
  computeDiffLineIndices,
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
})
