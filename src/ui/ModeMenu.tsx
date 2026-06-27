import { useMemo } from 'react'
import type { EditorMode } from '../app/appState'
import { EDITOR_MODES } from '../editor/editorModes'
import { preloadEditorMode } from '../editor/modePreload'
import { TopBarMenu, type TopBarMenuItem } from './TopBarMenu'

type ModeMenuProps = {
  mode: EditorMode
  onChange: (mode: EditorMode) => void
}

export function ModeMenu({ mode, onChange }: ModeMenuProps) {
  const items = useMemo<TopBarMenuItem[]>(
    () =>
      EDITOR_MODES.map((entry) => ({
        id: entry.id,
        label: entry.label,
        description: entry.description,
        active: entry.id === mode,
        testId: `mode-${entry.id}`,
        onSelect: () => onChange(entry.id),
        onHover: () => preloadEditorMode(entry.id),
      })),
    [mode, onChange],
  )

  const activeLabel = EDITOR_MODES.find((entry) => entry.id === mode)?.label ?? 'Raw'

  return (
    <TopBarMenu
      label={activeLabel}
      ariaLabel="Switch editor mode"
      testId="mode-menu"
      items={items}
    />
  )
}
