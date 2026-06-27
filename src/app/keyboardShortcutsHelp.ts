export type ShortcutGroup = {
  id: string
  label: string
  items: { action: string; keys: string }[]
}

export const KEYBOARD_SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { action: 'New document', keys: '⌘N' },
      { action: 'Open…', keys: '⌘O' },
      { action: 'Save', keys: '⌘S' },
      { action: 'Save As…', keys: '⌘⇧S' },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { action: 'Undo', keys: '⌘Z' },
      { action: 'Redo', keys: '⌘⇧Z' },
      { action: 'Find…', keys: '⌘F' },
      { action: 'Replace…', keys: '⌘⌥F' },
      { action: 'Copy Markdown', keys: '⌘⇧C' },
      { action: 'Copy HTML', keys: '⌘⇧H' },
      { action: 'Paste', keys: '⌘⇧V' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { action: 'Zen mode', keys: '⌘⇧E' },
      { action: 'Exit zen mode', keys: 'Esc' },
      { action: 'Keyboard shortcuts', keys: '⌘/' },
    ],
  },
]
