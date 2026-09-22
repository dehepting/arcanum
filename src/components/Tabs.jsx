import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { uploadPDF, deleteSource } from '../lib/upload';

const TAB_ICONS = {
  map: '🗺️',
  pdf: '📄',
  person: '👤',
  event: '📅',
  theory: '💡',
  place: '📍',
  artifact: '🏺',
  graph: '🕸️',
};

export default function Tabs() {
  const [uploading, setUploading] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const currentProject = useStore((state) => state.currentProject);
  const addTab = useStore((state) => state.addTab);
  const removeTab = useStore((state) => state.removeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);

  // Legacy support for sources (convert to tabs)
  const sources = useStore((state) => state.sources);
  const addSource = useStore((state) => state.addSource);
  const removeSource = useStore((state) => state.removeSource);

  // Close add menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    }

    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu]);

  const handleAddPDF = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      setShowAddMenu(false);
      try {
        const source = await uploadPDF(file, currentProject.id);
        addSource(source); // Still add to sources for backward compatibility
        addTab({
          type: 'pdf',
          title: source.title,
          data: { source },
        });
      } catch (err) {
        console.error('Upload error:', err);
        alert(`Failed to upload PDF: ${err.message}`);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleAddEntityPage = (entityType) => {
    const titles = {
      person: 'New Person',
      event: 'New Event',
      theory: 'New Theory',
      place: 'New Place',
      artifact: 'New Artifact',
    };

    addTab({
      type: entityType,
      title: titles[entityType] || 'New Entity',
      data: {
        entityId: null, // Will be created on first save
        entityType,
      },
    });
    setShowAddMenu(false);
  };

  const handleCloseTab = async (tab, e) => {
    e.stopPropagation();

    // If tab is dirty, confirm before closing
    if (tab.isDirty) {
      if (!confirm(`"${tab.title}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    // If it's a PDF tab, also remove from sources
    if (tab.type === 'pdf' && tab.data?.source) {
      try {
        await deleteSource(tab.data.source.id, tab.data.source.file_url);
        removeSource(tab.data.source.id);
      } catch (err) {
        console.error('Delete error:', err);
        alert(`Failed to delete PDF: ${err.message}`);
        return;
      }
    }

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
          {tabs.length > 1 && (
            <button className="tab-close" onClick={(e) => handleCloseTab(tab, e)} title="Close tab">
              ×
            </button>
          )}
        </button>
      ))}

      <div className="add-tab-container" ref={addMenuRef}>
        <button
          className="add-tab"
          onClick={() => setShowAddMenu(!showAddMenu)}
          disabled={uploading}
        >
          {uploading ? '⏳' : '+'}
        </button>

        {showAddMenu && (
          <div className="add-tab-menu">
            <div className="add-tab-menu-section">
              <div className="add-tab-menu-label">Documents</div>
              <button onClick={handleAddPDF}>
                <span className="menu-icon">📄</span>
                Upload PDF
              </button>
            </div>

            <div className="add-tab-menu-section">
              <div className="add-tab-menu-label">Entity Pages</div>
              <button onClick={() => handleAddEntityPage('person')}>
                <span className="menu-icon">👤</span>
                Person
              </button>
              <button onClick={() => handleAddEntityPage('event')}>
                <span className="menu-icon">📅</span>
                Event
              </button>
              <button onClick={() => handleAddEntityPage('theory')}>
                <span className="menu-icon">💡</span>
                Theory
              </button>
              <button onClick={() => handleAddEntityPage('place')}>
                <span className="menu-icon">📍</span>
                Place
              </button>
              <button onClick={() => handleAddEntityPage('artifact')}>
                <span className="menu-icon">🏺</span>
                Artifact
              </button>
            </div>

            <div className="add-tab-menu-section">
              <div className="add-tab-menu-label">Visualizations</div>
              <button
                onClick={() => {
                  addTab({
                    type: 'graph',
                    title: 'Network Graph',
                    data: null,
                  });
                  setShowAddMenu(false);
                }}
              >
                <span className="menu-icon">🕸️</span>
                Network Graph
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
