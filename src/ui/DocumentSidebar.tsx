import type { OutlineHeading } from '../markdown/outline'
import { FrontmatterPanel } from './FrontmatterPanel'
import type { FrontmatterFields } from '../markdown/frontmatter'

export type DocumentSidebarTab = 'outline' | 'frontmatter'

type DocumentSidebarProps = {
  tab: DocumentSidebarTab
  onTabChange: (tab: DocumentSidebarTab) => void
  onClose: () => void
  headings: OutlineHeading[]
  markdown: string
  hasFrontmatterMetadata: boolean
  onSelectLine: (line: number) => void
  onFrontmatterApply: (fields: FrontmatterFields) => void
}

export function DocumentSidebar({
  tab,
  onTabChange,
  onClose,
  headings,
  markdown,
  hasFrontmatterMetadata,
  onSelectLine,
  onFrontmatterApply,
}: DocumentSidebarProps) {
  return (
    <aside className="document-sidebar" aria-label="Document sidebar">
      <div className="document-sidebar__header">
        <div className="document-sidebar__tabs" role="tablist" aria-label="Sidebar panels">
          <button
            type="button"
            role="tab"
            className={`document-sidebar__tab${tab === 'outline' ? ' is-active' : ''}`}
            aria-selected={tab === 'outline'}
            onClick={() => onTabChange('outline')}
          >
            Outline
          </button>
          <button
            type="button"
            role="tab"
            className={`document-sidebar__tab${tab === 'frontmatter' ? ' is-active' : ''}`}
            aria-selected={tab === 'frontmatter'}
            onClick={() => onTabChange('frontmatter')}
            data-testid="frontmatter-tab"
          >
            Frontmatter
          </button>
        </div>
        <button
          type="button"
          className="document-sidebar__close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
      {tab === 'outline' ? (
        <div className="document-sidebar__panel" role="tabpanel">
          {headings.length === 0 ? (
            <p className="document-sidebar__empty">No headings yet</p>
          ) : (
            <ul className="document-sidebar__outline-list">
              {headings.map((heading) => (
                <li
                  key={`${heading.line}-${heading.text}`}
                  className="document-sidebar__outline-item"
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                >
                  <button
                    type="button"
                    className="document-sidebar__outline-link"
                    onClick={() => onSelectLine(heading.line)}
                  >
                    {heading.text || `Heading ${heading.level}`}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="document-sidebar__panel" role="tabpanel">
          <FrontmatterPanel
            markdown={markdown}
            hasMetadata={hasFrontmatterMetadata}
            onApply={onFrontmatterApply}
          />
        </div>
      )}
    </aside>
  )
}
