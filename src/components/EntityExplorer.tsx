import { useState, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import { uploadPDF } from '../lib/upload';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { getAllEntityTypes, getEntityType, invokeEntityCommand } from '../lib/entityTypes';
import EntityTypeSection from './EntityTypeSection';
import { useEntitySearch } from '../hooks/useEntitySearch';
import type { Person, Event, Theory, Place, Artifact, Source, EntityType, Entity } from '@/types';
import '../styles/entity.css';

// Canvas type from backend
interface Canvas {
  id: string;
  project_id: string;
  name: string;
  is_dashboard: boolean;
  created_at: string;
  updated_at: string;
}

// Entity type config for rendering (using any to allow mixed entity types)
interface EntityTypeConfig {
  type: EntityType;
  pluralKey: 'people' | 'events' | 'theories' | 'places' | 'artifacts';
  entities: Person[] | Event[] | Theory[] | Place[] | Artifact[];
  filtered: Person[] | Event[] | Theory[] | Place[] | Artifact[];
}

// Section keys for expanded state
type SectionKey = 'entities' | 'sources' | 'canvases' | 'visualizations';

// Entity type plural keys
type EntityTypePluralKey = 'people' | 'events' | 'theories' | 'places' | 'artifacts';

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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [editingCanvasName, setEditingCanvasName] = useState<string>('');
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingEntityName, setEditingEntityName] = useState<string>('');
  const [editingEntityType, setEditingEntityType] = useState<EntityType | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceTitle, setEditingSourceTitle] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    entities: true,
    sources: true,
    canvases: true,
    visualizations: true,
  });
  const [expandedEntityTypes, setExpandedEntityTypes] = useState<
    Record<EntityTypePluralKey, boolean>
  >({
    people: false,
    events: false,
    theories: false,
    places: false,
    artifacts: false,
  });
  const [entityDisplayLimits, setEntityDisplayLimits] = useState<
    Record<EntityTypePluralKey, number>
  >({
    people: 50,
    events: 50,
    theories: 50,
    places: 50,
    artifacts: 50,
  });

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleEntityType = (type: EntityTypePluralKey) => {
    setExpandedEntityTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const loadMoreEntities = (type: EntityTypePluralKey) => {
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
        const projectCanvases = await invoke<Canvas[]>('list_canvases', {
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
  const handleCanvasClick = (canvas: Canvas) => {
    const existingTab = tabs.find(
      (tab) => tab.type === 'canvas' && tab.data?.canvasId === canvas.id
    );

    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      addTab({
        type: 'canvas',
        title: canvas.name,
        data: {
          canvasId: canvas.id,
        },
      });
    }
  };

  // Handle create new canvas
  const handleCreateCanvas = async () => {
    if (!currentProject) return;

    try {
      const newCanvas = await invoke<Canvas>('create_canvas', {
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
  const handleCanvasDoubleClick = (canvas: Canvas, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCanvasId(canvas.id);
    setEditingCanvasName(canvas.name);
  };

  // Handle canvas rename
  const handleCanvasRename = async (canvasId: string) => {
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
  const handleEntityDoubleClick = (entity: Entity, entityType: EntityType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEntityId(entity.id);
    setEditingEntityName(entity.name);
    setEditingEntityType(entityType);
  };

  // Handle entity rename
  const handleEntityRename = async (entityId: string, entityType: EntityType) => {
    if (!editingEntityName.trim()) {
      setEditingEntityId(null);
      return;
    }

    try {
      const config = getEntityType(entityType);
      const updateFn = useStore.getState()[
        config.store.updater as keyof typeof useStore.getState
      ] as (id: string, updates: Partial<Entity>) => void;

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
  const handleSourceDoubleClick = (source: Source, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSourceId(source.id);
    setEditingSourceTitle(source.name);
  };

  // Handle source rename
  const handleSourceRename = async (sourceId: string) => {
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
        s.id === sourceId ? { ...s, name: editingSourceTitle.trim() } : s
      );
      useStore.getState().setSources(updatedSources);

      // Also update any open tabs with this source
      tabs.forEach((t) => {
        if (t.type === 'pdf' && t.data?.source?.id === sourceId) {
          useStore.getState().updateTab(t.id, {
            title: editingSourceTitle.trim(),
            data: { source: { ...t.data.source, name: editingSourceTitle.trim() } },
          });
        }
      });

      setEditingSourceId(null);
    } catch (error) {
      console.error('Failed to rename source:', error);
    }
  };

  // Filter entities using fuzzy search (searches name, description, bio, notes)
  // Cast to any to satisfy SearchableEntity constraint (entities have all required fields)
  const filteredPeople = useEntitySearch(people as any, searchQuery) as unknown as Person[];
  const filteredEvents = useEntitySearch(events as any, searchQuery) as unknown as Event[];
  const filteredTheories = useEntitySearch(theories as any, searchQuery) as unknown as Theory[];
  const filteredPlaces = useEntitySearch(places as any, searchQuery) as unknown as Place[];
  const filteredArtifacts = useEntitySearch(artifacts as any, searchQuery) as unknown as Artifact[];

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
  const entityTypeConfigs = useMemo<EntityTypeConfig[]>(
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
  const handleEntityClick = (entity: Entity, entityType: EntityType) => {
    // Check if tab already exists for this entity
    const existingTab = tabs.find((tab) => {
      if (tab.type !== 'entity') return false;
      return tab.data?.entityId === entity.id && tab.data?.entityType === entityType;
    });

    if (existingTab) {
      // Switch to existing tab instead of creating duplicate
      setActiveTab(existingTab.id);
    } else {
      // Create new tab
      addTab({
        type: 'entity',
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
  const handleEntityDragStart = (e: React.DragEvent, entity: Entity, entityType: EntityType) => {
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
  const handleCreateEntity = (entityType: EntityType) => {
    const config = getEntityType(entityType);

    addTab({
      type: 'entity',
      title: `New ${config.label}`,
      data: {
        entityId: null as any, // Will be created on first save
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
      const fileData = await readFile(selectedPath as string);
      const fileName = (selectedPath as string).split('/').pop() || 'document.pdf';

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
      } as File;

      const source = await uploadPDF(file, currentProject.id);
      console.log('Upload successful:', source);
      addSource(source);
      addTab({
        type: 'pdf',
        title: source.name,
        data: { source },
      });
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Failed to upload PDF: ${(err as Error).message}`);
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
                  isExpanded={Boolean(searchQuery || expandedEntityTypes[pluralKey])}
                  onToggle={() => !searchQuery && toggleEntityType(pluralKey)}
                  onEntityClick={(_, entity) => handleEntityClick(entity as Entity, type)}
                  onEntityDoubleClick={(entity, e) =>
                    handleEntityDoubleClick(entity as Entity, type, e)
                  }
                  onEntityRename={(entityId) =>
                    entityId ? handleEntityRename(entityId, type) : setEditingEntityId(null)
                  }
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
                  className={`entity-result ${tabs.find((t) => t.type === 'pdf' && t.data?.source?.id === source.id) ? 'active' : ''}`}
                  onClick={() => {
                    if (editingSourceId === source.id) return; // Don't open if editing
                    // Open source in tab
                    const existingTab = tabs.find(
                      (t) => t.type === 'pdf' && t.data?.source?.id === source.id
                    );
                    if (existingTab) {
                      setActiveTab(existingTab.id);
                    } else {
                      addTab({
                        type: 'pdf',
                        title: source.name,
                        data: { source },
                      });
                      setActiveSource(source.id);
                    }
                  }}
                  onDoubleClick={(e) => handleSourceDoubleClick(source, e)}
                  title={source.name}
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
                    <span className="entity-result-name">{source.name}</span>
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
                  type: 'map',
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
