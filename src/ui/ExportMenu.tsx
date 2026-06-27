import { useEffect, useId, useRef, useState } from 'react'
import {
  exportDocument,
  EXPORT_FORMATS,
  type ExportFormat,
} from '../documents/exportDocument'

type ExportMenuProps = {
  title: string
  markdown: string
  onExported: (message: string) => void
  onError: (message: string) => void
}

export function ExportMenu({
  title,
  markdown,
  onExported,
  onError,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
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

  async function handleExport(format: ExportFormat) {
    setBusy(true)
    setOpen(false)
    try {
      await exportDocument(title, markdown, format)
      const option = EXPORT_FORMATS.find((f) => f.id === format)
      onExported(`Exported ${option?.extension ?? ''}`)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="top-bar-menu" ref={rootRef}>
      <button
        type="button"
        className="top-bar__btn top-bar__btn--primary top-bar-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={busy}
        onClick={() => setOpen((prev) => !prev)}
      >
        Export
        <span className="top-bar-menu__chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <ul className="top-bar-menu__list" id={menuId} role="menu">
          {EXPORT_FORMATS.map((format) => (
            <li key={format.id} role="none">
              <button
                type="button"
                className="top-bar-menu__item"
                role="menuitem"
                onClick={() => void handleExport(format.id)}
              >
                <span className="top-bar-menu__item-row">
                  <span className="top-bar-menu__item-label">{format.label}</span>
                </span>
                <span className="top-bar-menu__item-desc">{format.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
