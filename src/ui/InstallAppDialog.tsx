import { useEffect } from 'react'
import { getInstallHelp } from '../app/installAppHelp'

type InstallAppDialogProps = {
  open: boolean
  onClose: () => void
}

export function InstallAppDialog({ open, onClose }: InstallAppDialogProps) {
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

  const help = getInstallHelp(import.meta.env.PROD)

  return (
    <div
      className="confirm-dialog__backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="shortcuts-dialog install-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-dialog-title"
        data-testid="install-app-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="install-dialog-title" className="confirm-dialog__title">
          {help.title}
        </h2>
        <ol className="install-dialog__steps">
          {help.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="install-dialog__note">
          Installed apps open in their own window and cache the editor shell for
          offline use. Your documents stay in the browser on this device.
        </p>
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
