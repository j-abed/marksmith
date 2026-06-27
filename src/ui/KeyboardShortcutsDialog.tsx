import { useEffect } from 'react'
import { KEYBOARD_SHORTCUT_GROUPS } from '../app/keyboardShortcutsHelp'

type KeyboardShortcutsDialogProps = {
  open: boolean
  onClose: () => void
}

export function KeyboardShortcutsDialog({
  open,
  onClose,
}: KeyboardShortcutsDialogProps) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="confirm-dialog__backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        data-testid="keyboard-shortcuts-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="shortcuts-dialog-title" className="confirm-dialog__title">
          Keyboard shortcuts
        </h2>
        <div className="shortcuts-dialog__groups">
          {KEYBOARD_SHORTCUT_GROUPS.map((group) => (
            <section key={group.id} className="shortcuts-dialog__group">
              <h3 className="shortcuts-dialog__group-label">{group.label}</h3>
              <ul className="shortcuts-dialog__list">
                {group.items.map((item) => (
                  <li key={item.action} className="shortcuts-dialog__row">
                    <span>{item.action}</span>
                    <kbd className="shortcuts-dialog__keys">{item.keys}</kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="top-bar__btn top-bar__btn--primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
