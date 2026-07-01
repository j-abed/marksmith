import { useApp } from '../app/AppProvider'
import { getActiveTab, tabLabel, type DocumentTab } from '../app/appState'

type DocumentTabBarProps = {
  onNewTab: () => void
}

export function DocumentTabBar({ onNewTab }: DocumentTabBarProps) {
  const { state, switchTab, closeTab } = useApp()
  const activeTab = getActiveTab(state)

  return (
    <div className="document-tab-bar" role="tablist" aria-label="Open documents" data-testid="document-tab-bar">
      {state.tabs.map((tab) => (
        <DocumentTabItem
          key={tab.id}
          tab={tab}
          active={tab.id === activeTab.id}
          onSelect={() => void switchTab(tab.id)}
          onClose={() => void closeTab(tab.id)}
        />
      ))}
      <button
        type="button"
        className="document-tab-bar__new"
        onClick={onNewTab}
        aria-label="New document tab"
        title="New document (⌘N)"
        data-testid="document-tab-new"
      >
        +
      </button>
    </div>
  )
}

type DocumentTabItemProps = {
  tab: DocumentTab
  active: boolean
  onSelect: () => void
  onClose: () => void
}

function DocumentTabItem({ tab, active, onSelect, onClose }: DocumentTabItemProps) {
  const label = tabLabel(tab)
  const dirty = tab.document.dirty

  return (
    <div
      className={`document-tab${active ? ' document-tab--active' : ''}${dirty ? ' document-tab--dirty' : ''}`}
      role="presentation"
    >
      <button
        type="button"
        className="document-tab__select"
        role="tab"
        aria-selected={active}
        aria-controls="editor-panel"
        id={`document-tab-${tab.id}`}
        onClick={onSelect}
        title={label}
      >
        <span className="document-tab__label">{label}</span>
        {dirty && <span className="document-tab__dot" aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="document-tab__close"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        aria-label={`Close ${label}`}
        title={`Close ${label}`}
      >
        ×
      </button>
    </div>
  )
}
