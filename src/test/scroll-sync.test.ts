import { describe, expect, it } from 'vitest'
import {
  computePreviewScrollTop,
  createSplitScrollSync,
  parseSourceLineId,
  ratioScrollTop,
  scrollRatio,
} from '../editor/scrollSync'

describe('scroll sync', () => {
  it('parses sanitized and raw source line ids', () => {
    expect(parseSourceLineId('user-content-src-line-12')).toBe(12)
    expect(parseSourceLineId('src-line-3')).toBe(3)
    expect(parseSourceLineId('other')).toBeNull()
  })

  it('maps scroll proportionally between panes', () => {
    expect(ratioScrollTop(50, 200, 100, 400, 100)).toBe(150)
    expect(ratioScrollTop(0, 200, 100, 400, 100)).toBe(0)
    expect(ratioScrollTop(100, 200, 100, 400, 100)).toBe(300)
  })

  it('interpolates preview scroll between anchors', () => {
    const container = {
      scrollHeight: 1000,
      clientHeight: 400,
    } as HTMLElement
    const anchors = [
      { line: 1, offsetTop: 0 },
      { line: 11, offsetTop: 400 },
    ]
    expect(computePreviewScrollTop(anchors, 6, container)).toBe(188)
  })

  it('ignores follower scroll echo via data-scroll-syncing flag', () => {
    const editor = {
      scrollTop: 0,
      scrollHeight: 1000,
      clientHeight: 400,
      getAttribute: () => null,
      setAttribute: () => {},
      removeAttribute: () => {},
    } as unknown as HTMLElement
    const preview = {
      scrollTop: 0,
      scrollHeight: 2000,
      clientHeight: 400,
      getAttribute: () => null,
      setAttribute: () => {},
      removeAttribute: () => {},
    } as unknown as HTMLElement

    const sync = createSplitScrollSync()

    editor.scrollTop = 300
    sync.onEditorScroll(editor, preview, true)
    expect(preview.scrollTop).toBeGreaterThan(0)

    const previewTop = preview.scrollTop
    preview.setAttribute = (name: string, value: string) => {
      if (name === 'data-scroll-syncing') preview.getAttribute = () => value
    }
    preview.getAttribute = () => 'true'
    sync.onPreviewScroll(editor, preview, true)
    expect(preview.scrollTop).toBe(previewTop)
  })

  it('computes scroll ratio', () => {
    const el = { scrollTop: 100, scrollHeight: 500, clientHeight: 200 } as HTMLElement
    expect(scrollRatio(el)).toBeCloseTo(0.333, 2)
  })
})
