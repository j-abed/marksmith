import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { saveHtmlAsWithPicker } from '../documents/fileAccess'
import { renderMarkdownToHtml } from '../markdown/renderMarkdown'

vi.mock('../markdown/renderMarkdown', () => ({
  renderMarkdownToHtml: vi.fn(async () => '<p>Hello</p>'),
}))

describe('saveHtmlAsWithPicker', () => {
  beforeEach(() => {
    vi.stubGlobal('showSaveFilePicker', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('downloads html when File System Access is unavailable', async () => {
    const click = vi.fn()
    const createElement = vi.spyOn(document, 'createElement').mockImplementation(
      () =>
        ({
          click,
          href: '',
          download: '',
        }) as unknown as HTMLAnchorElement,
    )
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const handle = await saveHtmlAsWithPicker('My Doc', '# Hello')

    expect(handle).toBeNull()
    expect(renderMarkdownToHtml).toHaveBeenCalledWith('# Hello')
    expect(click).toHaveBeenCalled()
    createElement.mockRestore()
  })
})
