import { useState, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import { uploadPDF } from '../lib/upload';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { getAllEntityTypes, getEntityType, invokeEntityCommand } from '../lib/entityTypes';
import EntityTypeSection from './EntityTypeSection';
import '../styles/entity.css';

/**
 * EntityExplorer - Left panel showing all entities in the knowledge graph
 * Features:
 * - Search entities across all types
 * - Click entities to open in tabs
 * - Create new entities
 * - Entity type filtering
 * - Upload and manage PDF sources
 */
export default function EntityExplorer() {
  // Individual selectors for better performance and stability
  const people = useStore((state) => state.people);
  const events = useStore((state) => state.events);
  const theories = useStore((state) => state.theories);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);
  const sources = useStore((state) => state.sources);
  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const addTab = useStore((state) => state.addTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const addSource = useStore((state) => state.addSource);
  const setActiveSource = useStore((state) => state.setActiveSource);
  const currentProject = useStore((state) => state.currentProject);

  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [canvases, setCanvases] = useState([]);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [editingCanvasName, setEditingCanvasName] = useState('');
  const [editingEntityId, setEditingEntityId] = useState(null);
  const [editingEntityName, setEditingEntityName] = useState('');
  const [editingEntityType, setEditingEntityType] = useState(null);
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [editingSourceTitle, setEditingSourceTitle] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    entities: true,
    sources: true,
    canvases: true,
    visualizations: true,
  });
  const [expandedEntityTypes, setExpandedEntityTypes] = useState({
    people: false,
    events: false,
    theories: false,
    places: false,
    artifacts: false,
  });
  const [entityDisplayLimits, setEntityDisplayLimits] = useState({
    people: 50,
    events: 50,
    theories: 50,
    places: 50,
    artifacts: 50,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleEntityType = (type) => {
    setExpandedEntityTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const loadMoreEntities = (type) => {
    setEntityDisplayLimits((prev) => ({
      ...prev,
      [type]: prev[type] + 50,
    }));
  };

  // Load canvases for current project
  useEffect(() => {
    if (!currentProject) return;

    const loadCanvases = async () => {
      try {
        const projectCanvases = await invoke('list_canvases', {
          projectId: currentProject.id,
        });
        setCanvases(projectCanvases);
      } catch (error) {
        console.error('Failed to load canvases:', error);
      }
    };

    loadCanvases();
  }, [currentProject]);

  // Handle canvas click - opens canvas in tab or switches to existing tab
  const handleCanvasClick = (canvas) => {
    const existingTab = tabs.find(
      (tab) => tab.type === 'canvas' && tab.data?.canvasId === canvas.id
    );

    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      addTab({
        type: 'canvas',
        title: canvas.name,
        canvasId: canvas.id,
        data: {
          canvasId: canvas.id,
          canvasName: canvas.name,
        },
      });
    }
  };

  // Handle create new canvas
  const handleCreateCanvas = async () => {
    if (!currentProject) return;

    try {
      const newCanvas = await invoke('create_canvas', {
        input: {
          project_id: currentProject.id,
          name: `Canvas ${canvases.length + 1}`,
          is_dashboard: false,
        },
      });

      setCanvases([...canvases, newCanvas]);
      handleCanvasClick(newCanvas);
    } catch (error) {
      console.error('Failed to create canvas:', error);
    }
  };

  // Handle canvas double-click to rename
  const handleCanvasDoubleClick = (canvas, e) => {
    e.stopPropagation();
    setEditingCanvasId(canvas.id);
    setEditingCanvasName(canvas.name);
  };

  // Handle canvas rename
  const handleCanvasRename = async (canvasId) => {
    if (!editingCanvasName.trim()) {
      setEditingCanvasId(null);
      return;
    }

    try {
      await invoke('update_canvas', {
        canvasId,
        input: {
          name: editingCanvasName.trim(),
        },
      });

      // Update local state
      setCanvases(
        canvases.map((c) => (c.id === canvasId ? { ...c, name: editingCanvasName.trim() } : c))
      );
      setEditingCanvasId(null);
    } catch (error) {
      console.error('Failed to rename canvas:', error);
    }
  };

  // Handle entity double-click to rename
  const handleEntityDoubleClick = (entity, entityType, e) => {
    e.stopPropagation();
    setEditingEntityId(entity.id);
    setEditingEntityName(entity.name);
    setEditingEntityType(entityType);
  };

  // Handle entity rename
  const handleEntityRename = async (entityId, entityType) => {
    if (!editingEntityName.trim()) {
      setEditingEntityId(null);
      return;
    }

    try {
      const config = getEntityType(entityType);
      const updateFn = useStore.getState()[config.store.updater];

      await invokeEntityCommand(invoke, entityType, 'update', {
        id: entityId,
        input: { name: editingEntityName.trim() },
      });

      // Update the store
      updateFn(entityId, { name: editingEntityName.trim() });

      setEditingEntityId(null);
    } catch (error) {
      console.error('Failed to rename entity:', error);
    }
  };

  // Handle source double-click to rename
  const handleSourceDoubleClick = (source, e) => {
    e.stopPropagation();
    setEditingSourceId(source.id);
    setEditingSourceTitle(source.title);
  };

  // Handle source rename
  const handleSourceRename = async (sourceId) => {
    if (!editingSourceTitle.trim()) {
      setEditingSourceId(null);
      return;
    }

    try {
      await invoke('update_source', {
        sourceId: sourceId,
        input: {
          title: editingSourceTitle.trim(),
        },
      });

      // Update the source in store
      const updatedSources = sources.map((s) =>
        s.id === sourceId ? { ...s, title: editingSourceTitle.trim() } : s
      );
      useStore.getState().setSources(updatedSources);

      // Also update any open tabs with this source
      const updatedTabs = tabs.map((t) =>
        t.data?.source?.id === sourceId
          ? {
              ...t,
              title: editingSourceTitle.trim(),
              data: { ...t.data, source: { ...t.data.source, title: editingSourceTitle.trim() } },
            }
          : t
      );
      tabs.forEach((t, idx) => {
        if (t.data?.source?.id === sourceId) {
          useStore.getState().updateTab(t.id, {
            title: editingSourceTitle.trim(),
            data: { ...t.data, source: { ...t.data.source, title: editingSourceTitle.trim() } },
          });
        }
      });

      setEditingSourceId(null);
    } catch (error) {
      console.error('Failed to rename source:', error);
    }
  };

  // Filter entities based on search query (memoized for performance)
  const filteredPeople = useMemo(
    () => people.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [people, searchQuery]
  );

  const filteredEvents = useMemo(
    () => events.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [events, searchQuery]
  );

  const filteredTheories = useMemo(
    () => theories.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [theories, searchQuery]
  );

  const filteredPlaces = useMemo(
    () => places.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [places, searchQuery]
  );

  const filteredArtifacts = useMemo(
    () => artifacts.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [artifacts, searchQuery]
  );

  const totalResults = useMemo(
    () =>
      filteredPeople.length +
      filteredEvents.length +
      filteredTheories.length +
      filteredPlaces.length +
      filteredArtifacts.length,
    [filteredPeople, filteredEvents, filteredTheories, filteredPlaces, filteredArtifacts]
  );

  // Entity type configurations for rendering
  const entityTypeConfigs = useMemo(
    () => [
      {
        type: 'person',
        pluralKey: 'people',
        entities: people,
        filtered: filteredPeople,
      },
      {
        type: 'event',
        pluralKey: 'events',
        entities: events,
        filtered: filteredEvents,
      },
      {
        type: 'theory',
        pluralKey: 'theories',
        entities: theories,
        filtered: filteredTheories,
      },
      {
        type: 'place',
        pluralKey: 'places',
        entities: places,
        filtered: filteredPlaces,
      },
      {
        type: 'artifact',
        pluralKey: 'artifacts',
        entities: artifacts,
        filtered: filteredArtifacts,
      },
    ],
    [
      people,
      events,
      theories,
      places,
      artifacts,
      filteredPeople,
      filteredEvents,
      filteredTheories,
      filteredPlaces,
      filteredArtifacts,
    ]
  );

  // Handle entity click - opens entity in tab or switches to existing tab
  const handleEntityClick = (entity, entityType) => {
    // Check if tab already exists for this entity
    const existingTab = tabs.find(
      (tab) => tab.type === entityType && tab.data?.entityId === entity.id
    );

    if (existingTab) {
      // Switch to existing tab instead of creating duplicate
      setActiveTab(existingTab.id);
    } else {
      // Create new tab
      addTab({
        type: entityType,
        title: entity.name,
        data: {
          entityId: entity.id,
          entityType,
        },
      });
    }
  };

  // Handle double-click - adds entity to canvas if canvas tab is active

  // Handle entity drag start - for dragging to canvas
  const handleEntityDragStart = (e, entity, entityType) => {
    console.log('🔵 DRAG START:', { name: entity.name, type: entityType });
    e.dataTransfer.effectAllowed = 'copy';
    const data = {
      entityId: entity.id,
      entityType,
      entityName: entity.name,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(data));
    console.log('🔵 Data set:', data);
  };

  // Handle create new entity
  const handleCreateEntity = (entityType) => {
    const config = getEntityType(entityType);

    addTab({
      type: entityType,
      title: `New ${config.label}`,
      data: {
        entityId: null, // Will be created on first save
        entityType,
      },
    });
  };

  // Handle add source (PDF upload)
  const handleAddSource = async () => {
    console.log('handleAddSource called');

    if (!currentProject) {
      alert('Please select a project first');
      return;
    }

    try {
      // Use Tauri dialog plugin for file selection
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      console.log('File selected:', selectedPath);

      if (!selectedPath) {
        console.log('No file selected');
        return;
      }

      setUploading(true);

      // Read file using Tauri fs plugin
      const fileData = await readFile(selectedPath);
      const fileName = selectedPath.split('/').pop() || 'document.pdf';

      console.log('Starting upload for project:', currentProject.id);

      // Create a File-like object for uploadPDF
      // readFile returns Uint8Array, convert to ArrayBuffer for uploadPDF
      const arrayBuffer = fileData.buffer.slice(
        fileData.byteOffset,
        fileData.byteOffset + fileData.byteLength
      );
      const file = {
        name: fileName,
        type: 'application/pdf',
        size: fileData.length,
        arrayBuffer: async () => arrayBuffer,
      };

      const source = await uploadPDF(file, currentProject.id);
      console.log('Upload successful:', source);
      addSource(source);
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

  return (
    <div className="entity-explorer">
      {/* Search Bar */}
      <div className="explorer-search">
        <input
          type="text"
          placeholder="Search entities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && <div className="search-results-count">{totalResults} results</div>}
      </div>

      {/* Entities Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('entities')}>
          <span className="section-icon">{expandedSections.entities ? '▼' : '▶'}</span>
          <span className="section-title">📁 Entities</span>
        </div>
        {expandedSections.entities && (
          <div className="section-content">
            {entityTypeConfigs.map(({ type, pluralKey, entities, filtered }) => {
              const displayEntities = searchQuery
                ? filtered.slice(0, 10)
                : filtered.slice(0, entityDisplayLimits[pluralKey]);

              return (
                <EntityTypeSection
                  key={type}
                  type={type}
                  entities={displayEntities}
                  isExpanded={searchQuery || expandedEntityTypes[pluralKey]}
                  onToggle={() => !searchQuery && toggleEntityType(pluralKey)}
                  onEntityClick={(_, entity) => handleEntityClick(entity, type)}
                  onEntityDoubleClick={(entity, e) => handleEntityDoubleClick(entity, type, e)}
                  onEntityRename={(entityId) => handleEntityRename(entityId, type)}
                  onLoadMore={() => loadMoreEntities(pluralKey)}
                  onCreateNew={() => handleCreateEntity(type)}
                  editingEntityId={editingEntityType === type ? editingEntityId : null}
                  editingEntityName={editingEntityName}
                  onEditingNameChange={setEditingEntityName}
                  totalCount={searchQuery ? filtered.length : entities.length}
                  limit={entityDisplayLimits[pluralKey]}
                  hasMore={!searchQuery && filtered.length > entityDisplayLimits[pluralKey]}
                  showCreate={!searchQuery}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Sources Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('sources')}>
          <span className="section-icon">{expandedSections.sources ? '▼' : '▶'}</span>
          <span className="section-title">📄 Sources ({sources.length})</span>
        </div>
        {expandedSections.sources && (
          <div className="section-content">
            {sources.length === 0 ? (
              <div className="placeholder-text">No sources yet</div>
            ) : (
              sources.map((source) => (
                <div
                  key={source.id}
                  className={`entity-result ${tabs.find((t) => t.data?.source?.id === source.id) ? 'active' : ''}`}
                  onClick={() => {
                    if (editingSourceId === source.id) return; // Don't open if editing
                    // Open source in tab
                    const existingTab = tabs.find((t) => t.data?.source?.id === source.id);
                    if (existingTab) {
                      setActiveTab(existingTab.id);
                    } else {
                      addTab({
                        type: 'pdf',
                        title: source.title,
                        data: { source },
                      });
                      setActiveSource(source.id);
                    }
                  }}
                  onDoubleClick={(e) => handleSourceDoubleClick(source, e)}
                  title={source.title}
                >
                  <span className="entity-result-icon">📄</span>
                  {editingSourceId === source.id ? (
                    <input
                      type="text"
                      className="entity-result-input"
                      value={editingSourceTitle}
                      onChange={(e) => setEditingSourceTitle(e.target.value)}
                      onBlur={() => handleSourceRename(source.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSourceRename(source.id);
                        } else if (e.key === 'Escape') {
                          setEditingSourceId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="entity-result-name">{source.title}</span>
                  )}
                </div>
              ))
            )}
            <button className="add-source-btn" onClick={handleAddSource} disabled={uploading}>
              {uploading ? '⏳ Uploading...' : '+ Add Source'}
            </button>
          </div>
        )}
      </div>

      {/* Canvases Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('canvases')}>
          <span className="section-icon">{expandedSections.canvases ? '▼' : '▶'}</span>
          <span className="section-title">🎨 Canvases</span>
        </div>
        {expandedSections.canvases && (
          <div className="section-content">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                className="entity-result"
                onClick={() => handleCanvasClick(canvas)}
                onDoubleClick={(e) => handleCanvasDoubleClick(canvas, e)}
                title="Click: open | Double-click: rename"
              >
                <span className="entity-result-icon">{canvas.is_dashboard ? '⭐' : '📋'}</span>
                {editingCanvasId === canvas.id ? (
                  <input
                    type="text"
                    className="rename-input"
                    value={editingCanvasName}
                    onChange={(e) => setEditingCanvasName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCanvasRename(canvas.id);
                      if (e.key === 'Escape') setEditingCanvasId(null);
                    }}
                    onBlur={() => handleCanvasRename(canvas.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="entity-result-name">{canvas.name}</span>
                )}
              </div>
            ))}
            <button className="create-entity-btn" onClick={handleCreateCanvas}>
              + New Canvas
            </button>
          </div>
        )}
      </div>

      {/* Visualizations Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('visualizations')}>
          <span className="section-icon">{expandedSections.visualizations ? '▼' : '▶'}</span>
          <span className="section-title">📊 Visualize</span>
        </div>
        {expandedSections.visualizations && (
          <div className="section-content">
            <div
              className="viz-item"
              onClick={() =>
                addTab({
                  type: 'graph',
                  title: 'Network Graph',
                  data: null,
                })
              }
            >
              <span className="viz-icon">🕸️</span>
              <span className="viz-label">Network Graph</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
