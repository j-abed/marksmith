import { useMemo } from 'react'
import { TopBarMenu, type TopBarMenuItem } from './TopBarMenu'

type ViewMenuProps = {
  outlineOpen: boolean
  onToggleOutline: () => void
  onOpenShortcuts: () => void
  canInstallApp: boolean
  onInstallApp: () => void
}

export function ViewMenu({
  outlineOpen,
  onToggleOutline,
  onOpenShortcuts,
  canInstallApp,
  onInstallApp,
}: ViewMenuProps) {
  const items = useMemo<TopBarMenuItem[]>(() => {
    const menu: TopBarMenuItem[] = [
      {
        id: 'outline',
        label: outlineOpen ? 'Hide outline' : 'Show outline',
        description: 'Jump to document headings',
        onSelect: onToggleOutline,
      },
      {
        id: 'shortcuts',
        label: 'Keyboard shortcuts…',
        description: 'Reference for editor shortcuts',
        shortcut: '⌘/',
        onSelect: onOpenShortcuts,
      },
    ]

    if (canInstallApp) {
      menu.push({
        id: 'install',
        label: 'Install app…',
        description: 'Add Marksmith to your dock or home screen',
        onSelect: onInstallApp,
      })
    }

    return menu
  }, [canInstallApp, onInstallApp, onOpenShortcuts, onToggleOutline, outlineOpen])

  return <TopBarMenu label="View" items={items} />
}
