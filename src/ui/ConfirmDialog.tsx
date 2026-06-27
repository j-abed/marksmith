type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Discard',
  cancelLabel = 'Keep editing',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="confirm-dialog__backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="confirm-dialog__message">
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button type="button" className="top-bar__btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="top-bar__btn top-bar__btn--primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
