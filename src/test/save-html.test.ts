import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  saveHtmlAsWithPicker,
  saveLinkedFile,
} from '../documents/fileAccess'
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

  it('writes to an existing html handle without opening a picker', async () => {
    const write = vi.fn()
    const close = vi.fn()
    const handle = {
      name: 'notes.html',
      createWritable: vi.fn(async () => ({ write, close })),
    } as unknown as FileSystemFileHandle

    const saved = await saveHtmlAsWithPicker('Notes', '# Hello', handle)

    expect(saved).toBe(handle)
    expect(write).toHaveBeenCalled()
    expect(close).toHaveBeenCalled()
  })
})

describe('saveLinkedFile', () => {
  it('routes html linked files through html export', async () => {
    const write = vi.fn()
    const close = vi.fn()
    const handle = {
      name: 'notes.html',
      createWritable: vi.fn(async () => ({ write, close })),
    } as unknown as FileSystemFileHandle

    await saveLinkedFile('Notes', '# Hello', handle, 'html')

    expect(renderMarkdownToHtml).toHaveBeenCalledWith('# Hello')
    expect(write).toHaveBeenCalled()
  })
})
