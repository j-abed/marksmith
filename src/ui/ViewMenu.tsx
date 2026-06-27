import { useMemo } from 'react'
import { TopBarMenu, type TopBarMenuItem } from './TopBarMenu'

type ViewMenuProps = {
  outlineOpen: boolean
  frontmatterOpen: boolean
  onToggleOutline: () => void
  onToggleFrontmatter: () => void
  onOpenShortcuts: () => void
  canInstallApp: boolean
  onInstallApp: () => void
}

export function ViewMenu({
  outlineOpen,
  frontmatterOpen,
  onToggleOutline,
  onToggleFrontmatter,
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
        id: 'frontmatter',
        label: frontmatterOpen ? 'Hide frontmatter' : 'Show frontmatter',
        description: 'Edit YAML title, date, and tags',
        onSelect: onToggleFrontmatter,
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
  }, [
    canInstallApp,
    frontmatterOpen,
    onInstallApp,
    onOpenShortcuts,
    onToggleFrontmatter,
    onToggleOutline,
    outlineOpen,
  ])

  return <TopBarMenu label="View" items={items} />
}
