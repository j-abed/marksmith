import { describe, expect, it } from 'vitest'
import { pasteTextAtSelection } from '../documents/clipboard'

describe('clipboard', () => {
  it('pastes text at selection', () => {
    const result = pasteTextAtSelection('world', 'hello there', {
      from: 6,
      to: 11,
    })
    expect(result.text).toBe('hello world')
    expect(result.selection).toEqual({ from: 11, to: 11 })
  })

  it('replaces selected range when pasting', () => {
    const result = pasteTextAtSelection('X', 'abc def', { from: 4, to: 7 })
    expect(result.text).toBe('abc X')
  })
})
