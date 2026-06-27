type ZenExitButtonProps = {
  onExit: () => void
}

export function ZenExitButton({ onExit }: ZenExitButtonProps) {
  return (
    <button
      type="button"
      className="zen-exit"
      onClick={onExit}
      aria-label="Exit zen mode"
      title="Exit zen mode (Esc)"
    >
      Exit zen
    </button>
  )
}
