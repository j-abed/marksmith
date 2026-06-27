import type { OutlineHeading } from '../markdown/outline'

type OutlineSidebarProps = {
  headings: OutlineHeading[]
  onSelectLine: (line: number) => void
  onClose: () => void
}

export function OutlineSidebar({
  headings,
  onSelectLine,
  onClose,
}: OutlineSidebarProps) {
  return (
    <aside className="outline-sidebar" aria-label="Document outline">
      <div className="outline-sidebar__header">
        <h2 className="outline-sidebar__title">Outline</h2>
        <button
          type="button"
          className="outline-sidebar__close"
          onClick={onClose}
          aria-label="Close outline"
        >
          ×
        </button>
      </div>
      {headings.length === 0 ? (
        <p className="outline-sidebar__empty">No headings yet</p>
      ) : (
        <ul className="outline-sidebar__list">
          {headings.map((heading) => (
            <li
              key={`${heading.line}-${heading.text}`}
              className="outline-sidebar__item"
              style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
            >
              <button
                type="button"
                className="outline-sidebar__link"
                onClick={() => onSelectLine(heading.line)}
              >
                {heading.text || `Heading ${heading.level}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
