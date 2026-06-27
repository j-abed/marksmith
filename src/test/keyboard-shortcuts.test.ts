import { describe, expect, it, vi } from 'vitest'
import { handleAppKeyboardEvent, type AppKeyboardHandlers } from '../app/keyboardShortcuts'

function createHandlers(
  overrides: Partial<AppKeyboardHandlers> = {},
): AppKeyboardHandlers {
  return {
    zenMode: false,
    mode: 'raw',
    canSaveToDisk: false,
    markdown: '# Hello',
    newDocument: vi.fn().mockResolvedValue('New document'),
    openFileFromInput: vi.fn().mockResolvedValue(undefined),
    openFind: vi.fn(),
  openReplace: vi.fn(),
  openShortcutsHelp: vi.fn(),
    saveFile: vi.fn().mockResolvedValue('Saved to file'),
    saveFileAs: vi.fn().mockResolvedValue('Downloaded .md'),
    toggleZenMode: vi.fn(),
    setMarkdown: vi.fn(),
    notify: vi.fn(),
    getEditorView: () => null,
    ...overrides,
  }
}

function keyEvent(
  key: string,
  options: { meta?: boolean; shift?: boolean; alt?: boolean } = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    metaKey: options.meta ?? true,
    shiftKey: options.shift ?? false,
    altKey: options.alt ?? false,
    bubbles: true,
    cancelable: true,
  })
}

describe('handleAppKeyboardEvent', () => {
  it('opens a file with Mod-o', () => {
    const handlers = createHandlers()
    const event = keyEvent('o')
    expect(handleAppKeyboardEvent(event, handlers)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
    expect(handlers.openFileFromInput).toHaveBeenCalled()
  })

  it('creates a new document with Mod-n', () => {
    const handlers = createHandlers()
    handleAppKeyboardEvent(keyEvent('n'), handlers)
    expect(handlers.newDocument).toHaveBeenCalled()
  })

  it('uses Save As when no file is linked on Mod-s', () => {
    const handlers = createHandlers({ canSaveToDisk: false })
    handleAppKeyboardEvent(keyEvent('s'), handlers)
    expect(handlers.saveFileAs).toHaveBeenCalled()
    expect(handlers.saveFile).not.toHaveBeenCalled()
  })

  it('saves linked file on Mod-s', () => {
    const handlers = createHandlers({ canSaveToDisk: true })
    handleAppKeyboardEvent(keyEvent('s'), handlers)
    expect(handlers.saveFile).toHaveBeenCalled()
    expect(handlers.saveFileAs).not.toHaveBeenCalled()
  })

  it('toggles zen mode with Mod-Shift-e', () => {
    const handlers = createHandlers()
    handleAppKeyboardEvent(keyEvent('e', { shift: true }), handlers)
    expect(handlers.toggleZenMode).toHaveBeenCalled()
  })

  it('opens replace with Mod-Alt-f', () => {
    const handlers = createHandlers()
    handleAppKeyboardEvent(keyEvent('f', { alt: true }), handlers)
    expect(handlers.openReplace).toHaveBeenCalled()
    expect(handlers.openFind).not.toHaveBeenCalled()
  })

  it('opens keyboard shortcuts with Mod-/', () => {
    const handlers = createHandlers()
    handleAppKeyboardEvent(keyEvent('/'), handlers)
    expect(handlers.openShortcutsHelp).toHaveBeenCalled()
  })

  it('does not handle Mod-z in preview mode', () => {
    const handlers = createHandlers({
      mode: 'preview',
      getEditorView: () => ({ dispatch: vi.fn() }) as never,
    })
    const event = keyEvent('z')
    expect(handleAppKeyboardEvent(event, handlers)).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })
})
