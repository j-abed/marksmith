import { Prec, type Extension } from '@codemirror/state'
import { keymap, type KeyBinding } from '@codemirror/view'
import { undo, redo } from '@codemirror/commands'
import type { AppKeyboardHandlers } from '../app/keyboardShortcuts'
import { handleAppKeyboardEvent } from '../app/keyboardShortcuts'

function modKeyEvent(
  key: string,
  shift = false,
  alt = false,
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    metaKey: true,
    shiftKey: shift,
    altKey: alt,
  })
}

export function createAppKeymapExtension(
  getHandlers: () => AppKeyboardHandlers,
): Extension {
  const bindings: KeyBinding[] = [
    {
      key: 'Mod-z',
      run: (view) => undo(view),
    },
    {
      key: 'Mod-Shift-z',
      run: (view) => redo(view),
    },
    {
      key: 'Mod-y',
      run: (view) => redo(view),
    },
    {
      key: 'Mod-n',
      run: () => handleAppKeyboardEvent(modKeyEvent('n'), getHandlers()),
    },
    {
      key: 'Mod-o',
      run: () => handleAppKeyboardEvent(modKeyEvent('o'), getHandlers()),
    },
    {
      key: 'Mod-s',
      run: () => handleAppKeyboardEvent(modKeyEvent('s'), getHandlers()),
    },
    {
      key: 'Mod-Shift-s',
      run: () => handleAppKeyboardEvent(modKeyEvent('s', true), getHandlers()),
    },
    {
      key: 'Mod-f',
      run: () => handleAppKeyboardEvent(modKeyEvent('f'), getHandlers()),
    },
    {
      key: 'Mod-Alt-f',
      run: () =>
        handleAppKeyboardEvent(modKeyEvent('f', false, true), getHandlers()),
    },
    {
      key: 'Mod-/',
      run: () => handleAppKeyboardEvent(modKeyEvent('/'), getHandlers()),
    },
    {
      key: 'Mod-Shift-e',
      run: () => handleAppKeyboardEvent(modKeyEvent('e', true), getHandlers()),
    },
    {
      key: 'Mod-Shift-c',
      run: () => handleAppKeyboardEvent(modKeyEvent('c', true), getHandlers()),
    },
    {
      key: 'Mod-Shift-h',
      run: () => handleAppKeyboardEvent(modKeyEvent('h', true), getHandlers()),
    },
    {
      key: 'Mod-Shift-v',
      run: () => handleAppKeyboardEvent(modKeyEvent('v', true), getHandlers()),
    },
  ]

  return Prec.highest(keymap.of(bindings))
}
