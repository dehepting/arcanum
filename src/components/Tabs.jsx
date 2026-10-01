import useStore from '../store/useStore';

const TAB_ICONS = {
  map: '🗺️',
  pdf: '📄',
  person: '👤',
  event: '📅',
  theory: '💡',
  place: '📍',
  artifact: '🏺',
  graph: '🕸️',
  canvas: '🎨',
};

export default function Tabs() {
  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const removeTab = useStore((state) => state.removeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  const handleCloseTab = (tab, e) => {
    e.stopPropagation();

    // If tab is dirty, confirm before closing
    if (tab.isDirty) {
      if (!confirm(`"${tab.title}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    // Just close the tab - don't delete the source
    // Sources can be deleted via right-click context menu in the sidebar
    removeTab(tab.id);
  };

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTabId === tab.id ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          title={tab.title}
        >
          <span className="tab-icon">{TAB_ICONS[tab.type] || '📄'}</span>
          <span className="tab-title">
            {tab.title}
            {tab.isDirty && <span className="dirty-indicator">•</span>}
          </span>
          {tab.type !== 'map' && (
            <span
              className="tab-close"
              onClick={(e) => handleCloseTab(tab, e)}
              title="Close tab"
              role="button"
              tabIndex={0}
            >
              ×
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
