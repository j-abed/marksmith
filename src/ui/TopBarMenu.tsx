import { useEffect, useId, useRef, useState } from 'react'

export type TopBarMenuEntry =
  | {
      type?: 'item'
      id: string
      label: string
      description?: string
      shortcut?: string
      disabled?: boolean
      active?: boolean
      testId?: string
      onSelect: () => void
      onHover?: () => void
    }
  | {
      type: 'separator'
      id: string
    }

export type TopBarMenuItem = Extract<TopBarMenuEntry, { type?: 'item' }>

type TopBarMenuProps = {
  label: string
  items: TopBarMenuEntry[]
  primary?: boolean
  ariaLabel?: string
  testId?: string
}

export function TopBarMenu({
  label,
  items,
  primary = false,
  ariaLabel,
  testId,
}: TopBarMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function selectItem(item: TopBarMenuItem) {
    if (item.disabled) return
    setOpen(false)
    item.onSelect()
  }

  return (
    <div className="top-bar-menu" ref={rootRef}>
      <button
        type="button"
        className={`top-bar__btn top-bar-menu__trigger${primary ? ' top-bar__btn--primary' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        data-testid={testId}
        onClick={() => setOpen((prev) => !prev)}
      >
        {label}
        <span className="top-bar-menu__chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul className="top-bar-menu__list" id={menuId} role="menu">
          {items.map((item) =>
            item.type === 'separator' ? (
              <li key={item.id} role="separator" className="top-bar-menu__separator" />
            ) : (
              <li key={item.id} role="none">
                <button
                  type="button"
                  className={`top-bar-menu__item${item.active ? ' top-bar-menu__item--active' : ''}`}
                  role="menuitem"
                  disabled={item.disabled}
                  data-testid={item.testId}
                  onMouseEnter={item.onHover}
                  onFocus={item.onHover}
                  onClick={() => selectItem(item)}
                >
                  <span className="top-bar-menu__item-row">
                    <span className="top-bar-menu__item-label">
                      {item.active ? '✓ ' : ''}
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span className="top-bar-menu__item-shortcut">{item.shortcut}</span>
                    )}
                  </span>
                  {item.description && (
                    <span className="top-bar-menu__item-desc">{item.description}</span>
                  )}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
