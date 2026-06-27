import type { Theme } from '../app/appState'

type ThemeToggleProps = {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDark ? '☾' : '☀'}
      </span>
      <span className="theme-toggle__label">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
