import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { uploadPDF } from '../lib/upload';
import { invoke } from '@tauri-apps/api/core';
import './EntityExplorer.css';

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
  const people = useStore((state) => state.people);
  const events = useStore((state) => state.events);
  const theories = useStore((state) => state.theories);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);
  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const addTab = useStore((state) => state.addTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const addSource = useStore((state) => state.addSource);
  const currentProject = useStore((state) => state.currentProject);
  const updatePerson = useStore((state) => state.updatePerson);
  const updateEvent = useStore((state) => state.updateEvent);
  const updateTheory = useStore((state) => state.updateTheory);
  const updatePlace = useStore((state) => state.updatePlace);
  const updateArtifact = useStore((state) => state.updateArtifact);

  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [canvases, setCanvases] = useState([]);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [editingCanvasName, setEditingCanvasName] = useState('');
  const [editingEntityId, setEditingEntityId] = useState(null);
  const [editingEntityName, setEditingEntityName] = useState('');
  const [editingEntityType, setEditingEntityType] = useState(null);
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
      const commandMap = {
        person: 'update_person',
        event: 'update_event',
        theory: 'update_theory',
        place: 'update_place',
        artifact: 'update_artifact',
      };

      const idParamMap = {
        person: 'personId',
        event: 'eventId',
        theory: 'theoryId',
        place: 'placeId',
        artifact: 'artifactId',
      };

      const updateFnMap = {
        person: updatePerson,
        event: updateEvent,
        theory: updateTheory,
        place: updatePlace,
        artifact: updateArtifact,
      };

      await invoke(commandMap[entityType], {
        [idParamMap[entityType]]: entityId,
        input: {
          name: editingEntityName.trim(),
        },
      });

      // Update the store
      updateFnMap[entityType](entityId, { name: editingEntityName.trim() });

      setEditingEntityId(null);
    } catch (error) {
      console.error('Failed to rename entity:', error);
    }
  };

  // Filter entities based on search query
  const filteredPeople = people.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTheories = theories.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredArtifacts = artifacts.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalResults =
    filteredPeople.length +
    filteredEvents.length +
    filteredTheories.length +
    filteredPlaces.length +
    filteredArtifacts.length;

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
    const titles = {
      person: 'New Person',
      event: 'New Event',
      theory: 'New Theory',
      place: 'New Place',
      artifact: 'New Artifact',
    };

    addTab({
      type: entityType,
      title: titles[entityType],
      data: {
        entityId: null, // Will be created on first save
        entityType,
      },
    });
  };

  // Handle add source (PDF upload)
  const handleAddSource = () => {
    console.log('handleAddSource called');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      console.log('File selected:', file);
      if (!file) return;

      setUploading(true);
      try {
        console.log('Starting upload for project:', currentProject.id);
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
    input.click();
    console.log('File input clicked');
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
            {/* People */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('people')}
            >
              <span className="section-icon">{expandedEntityTypes.people ? '▼' : '▶'}</span>
              <span className="entity-icon">👤</span>
              <span className="entity-label">People</span>
              <span className="entity-count">
                ({searchQuery ? filteredPeople.length : people.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.people) && (
              <>
                {(searchQuery ? filteredPeople.slice(0, 10) : filteredPeople).map((person) => (
                  <div
                    key={person.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(person, 'person')}
                    onDoubleClick={(e) => handleEntityDoubleClick(person, 'person', e)}
                    title="Click: open | Double-click: rename"
                  >
                    <span className="entity-result-icon">👤</span>
                    {editingEntityId === person.id && editingEntityType === 'person' ? (
                      <input
                        type="text"
                        className="rename-input"
                        value={editingEntityName}
                        onChange={(e) => setEditingEntityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEntityRename(person.id, 'person');
                          if (e.key === 'Escape') setEditingEntityId(null);
                        }}
                        onBlur={() => handleEntityRename(person.id, 'person')}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="entity-result-name">{person.name}</span>
                    )}
                  </div>
                ))}
                {!searchQuery && (
                  <button
                    className="create-entity-btn"
                    onClick={() => handleCreateEntity('person')}
                  >
                    + Create Person
                  </button>
                )}
              </>
            )}

            {/* Events */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('events')}
            >
              <span className="section-icon">{expandedEntityTypes.events ? '▼' : '▶'}</span>
              <span className="entity-icon">📅</span>
              <span className="entity-label">Events</span>
              <span className="entity-count">
                ({searchQuery ? filteredEvents.length : events.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.events) && (
              <>
                {(searchQuery ? filteredEvents.slice(0, 10) : filteredEvents).map((event) => (
                  <div
                    key={event.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(event, 'event')}
                    onDoubleClick={(e) => handleEntityDoubleClick(event, 'event', e)}
                    title="Click: open | Double-click: rename"
                  >
                    <span className="entity-result-icon">📅</span>
                    {editingEntityId === event.id && editingEntityType === 'event' ? (
                      <input
                        type="text"
                        className="rename-input"
                        value={editingEntityName}
                        onChange={(e) => setEditingEntityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEntityRename(event.id, 'event');
                          if (e.key === 'Escape') setEditingEntityId(null);
                        }}
                        onBlur={() => handleEntityRename(event.id, 'event')}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="entity-result-name">{event.name}</span>
                    )}
                  </div>
                ))}
                {!searchQuery && (
                  <button className="create-entity-btn" onClick={() => handleCreateEntity('event')}>
                    + Create Event
                  </button>
                )}
              </>
            )}

            {/* Theories */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('theories')}
            >
              <span className="section-icon">{expandedEntityTypes.theories ? '▼' : '▶'}</span>
              <span className="entity-icon">💡</span>
              <span className="entity-label">Theories</span>
              <span className="entity-count">
                ({searchQuery ? filteredTheories.length : theories.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.theories) && (
              <>
                {(searchQuery ? filteredTheories.slice(0, 10) : filteredTheories).map((theory) => (
                  <div
                    key={theory.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(theory, 'theory')}
                    onDoubleClick={(e) => handleEntityDoubleClick(theory, 'theory', e)}
                    title="Click: open | Double-click: rename"
                  >
                    <span className="entity-result-icon">💡</span>
                    {editingEntityId === theory.id && editingEntityType === 'theory' ? (
                      <input
                        type="text"
                        className="rename-input"
                        value={editingEntityName}
                        onChange={(e) => setEditingEntityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEntityRename(theory.id, 'theory');
                          if (e.key === 'Escape') setEditingEntityId(null);
                        }}
                        onBlur={() => handleEntityRename(theory.id, 'theory')}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="entity-result-name">{theory.name}</span>
                    )}
                  </div>
                ))}
                {!searchQuery && (
                  <button
                    className="create-entity-btn"
                    onClick={() => handleCreateEntity('theory')}
                  >
                    + Create Theory
                  </button>
                )}
              </>
            )}

            {/* Places */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('places')}
            >
              <span className="section-icon">{expandedEntityTypes.places ? '▼' : '▶'}</span>
              <span className="entity-icon">📍</span>
              <span className="entity-label">Places</span>
              <span className="entity-count">
                ({searchQuery ? filteredPlaces.length : places.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.places) && (
              <>
                {(searchQuery ? filteredPlaces.slice(0, 10) : filteredPlaces).map((place) => (
                  <div
                    key={place.id}
                    className="entity-result"
                    onClick={() => handleEntityClick(place, 'place')}
                    onDoubleClick={(e) => handleEntityDoubleClick(place, 'place', e)}
                    title="Click: open | Double-click: rename"
                  >
                    <span className="entity-result-icon">📍</span>
                    {editingEntityId === place.id && editingEntityType === 'place' ? (
                      <input
                        type="text"
                        className="rename-input"
                        value={editingEntityName}
                        onChange={(e) => setEditingEntityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEntityRename(place.id, 'place');
                          if (e.key === 'Escape') setEditingEntityId(null);
                        }}
                        onBlur={() => handleEntityRename(place.id, 'place')}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span className="entity-result-name">{place.name}</span>
                    )}
                  </div>
                ))}
                {!searchQuery && (
                  <button className="create-entity-btn" onClick={() => handleCreateEntity('place')}>
                    + Create Place
                  </button>
                )}
              </>
            )}

            {/* Artifacts */}
            <div
              className="entity-type-item"
              onClick={() => !searchQuery && toggleEntityType('artifacts')}
            >
              <span className="section-icon">{expandedEntityTypes.artifacts ? '▼' : '▶'}</span>
              <span className="entity-icon">🏺</span>
              <span className="entity-label">Artifacts</span>
              <span className="entity-count">
                ({searchQuery ? filteredArtifacts.length : artifacts.length})
              </span>
            </div>
            {(searchQuery || expandedEntityTypes.artifacts) && (
              <>
                {(searchQuery ? filteredArtifacts.slice(0, 10) : filteredArtifacts).map(
                  (artifact) => (
                    <div
                      key={artifact.id}
                      className="entity-result"
                      onClick={() => handleEntityClick(artifact, 'artifact')}
                      onDoubleClick={(e) => handleEntityDoubleClick(artifact, 'artifact', e)}
                      title="Click: open | Double-click: rename"
                    >
                      <span className="entity-result-icon">🏺</span>
                      {editingEntityId === artifact.id && editingEntityType === 'artifact' ? (
                        <input
                          type="text"
                          className="rename-input"
                          value={editingEntityName}
                          onChange={(e) => setEditingEntityName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEntityRename(artifact.id, 'artifact');
                            if (e.key === 'Escape') setEditingEntityId(null);
                          }}
                          onBlur={() => handleEntityRename(artifact.id, 'artifact')}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span className="entity-result-name">{artifact.name}</span>
                      )}
                    </div>
                  )
                )}
                {!searchQuery && (
                  <button
                    className="create-entity-btn"
                    onClick={() => handleCreateEntity('artifact')}
                  >
                    + Create Artifact
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Sources Section */}
      <div className="explorer-section">
        <div className="section-header" onClick={() => toggleSection('sources')}>
          <span className="section-icon">{expandedSections.sources ? '▼' : '▶'}</span>
          <span className="section-title">📄 Sources</span>
        </div>
        {expandedSections.sources && (
          <div className="section-content">
            <div className="placeholder-text">No sources yet</div>
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
