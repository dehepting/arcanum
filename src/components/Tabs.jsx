import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { updateSource } from '../lib/tauri';

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
  const updateTab = useStore((state) => state.updateTab);
  const sources = useStore((state) => state.sources);
  const setSources = useStore((state) => state.setSources);

  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef(null);

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

  const handleDoubleClick = (tab, e) => {
    e.stopPropagation();
    // Don't allow renaming the default map tab
    if (tab.type === 'map' && tab.id === 'default-map') return;

    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleRename = async (tab) => {
    if (!editingTitle.trim()) {
      setEditingTabId(null);
      return;
    }

    // Update tab title
    updateTab(tab.id, { title: editingTitle.trim() });

    // If it's a PDF tab, also update the source
    if (tab.type === 'pdf' && tab.data?.source) {
      try {
        await updateSource(tab.data.source.id, { title: editingTitle.trim() });

        // Update source in store
        const updatedSources = sources.map((s) =>
          s.id === tab.data.source.id ? { ...s, title: editingTitle.trim() } : s
        );
        setSources(updatedSources);
      } catch (err) {
        console.error('Failed to update source:', err);
      }
    }

    setEditingTabId(null);
  };

  const handleKeyDown = (tab, e) => {
    if (e.key === 'Enter') {
      handleRename(tab);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTabId === tab.id ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          onDoubleClick={(e) => handleDoubleClick(tab, e)}
          title={tab.title}
        >
          <span className="tab-icon">{TAB_ICONS[tab.type] || '📄'}</span>
          {editingTabId === tab.id ? (
            <input
              ref={inputRef}
              type="text"
              className="tab-title-input"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => handleRename(tab)}
              onKeyDown={(e) => handleKeyDown(tab, e)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="tab-title">
              {tab.title}
              {tab.isDirty && <span className="dirty-indicator">•</span>}
            </span>
          )}
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
