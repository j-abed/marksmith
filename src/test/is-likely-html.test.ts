import { describe, expect, it } from 'vitest'
import { isLikelyHtml } from '../markdown/isLikelyHtml'

describe('isLikelyHtml', () => {
  it('detects full html documents', () => {
    expect(isLikelyHtml('<!DOCTYPE html><html><body><p>Hi</p></body></html>')).toBe(
      true,
    )
  })

  it('detects html fragments from llms', () => {
    expect(
      isLikelyHtml('<p>Hello</p><ul><li>One</li><li>Two</li></ul>'),
    ).toBe(true)
  })

  it('does not treat markdown as html', () => {
    expect(isLikelyHtml('# Title\n\nSome **bold** text.')).toBe(false)
  })

  it('does not treat inline code with angle brackets as html', () => {
    expect(isLikelyHtml('Use `npm install` and `<Component />` in prose.')).toBe(
      false,
    )
  })
})
