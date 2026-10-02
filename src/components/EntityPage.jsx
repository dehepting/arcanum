import { useState, useEffect, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import { getEntityPage, updateEntityPage } from '../lib/entityPages';
import { getAnnotationsForEntity } from '../lib/annotationLinks';
import { invoke } from '@tauri-apps/api/core';
import useStore from '../store/useStore';
import '../styles/entity.css';

/**
 * EntityPage - Display and edit entity page content
 * Features:
 * - Rich text editing with Tiptap
 * - Auto-save (debounced)
 * - Loading states
 * - Error handling
 * - Tab dirty state integration
 */
export default function EntityPage({ entityId, entityType, title, projectId, tabId, onClose }) {
  const [content, setContent] = useState('');
  const [entityData, setEntityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [linkedAnnotations, setLinkedAnnotations] = useState([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const updateTab = useStore((state) => state.updateTab);
  const sources = useStore((state) => state.sources);
  const tabs = useStore((state) => state.tabs);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const addTab = useStore((state) => state.addTab);
  const setCurrentPage = useStore((state) => state.setCurrentPage);

  // Load entity page content and metadata
  useEffect(() => {
    async function loadContent() {
      if (!entityId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load entity metadata based on type
        const commandMap = {
          person: { command: 'get_person', param: 'person_id' },
          event: { command: 'get_event', param: 'event_id' },
          theory: { command: 'get_theory', param: 'theory_id' },
          place: { command: 'get_place', param: 'place_id' },
          artifact: { command: 'get_artifact', param: 'artifact_id' },
        };

        const config = commandMap[entityType];
        if (config) {
          try {
            const metadata = await invoke(config.command, { [config.param]: entityId });
            setEntityData(metadata);
          } catch (metadataError) {
            console.error('Error loading entity metadata:', metadataError);
          }
        }

        // Load entity page content
        const { data, error: loadError } = await getEntityPage(entityId);

        if (loadError) {
          // Handle error object properly
          const errorMessage =
            typeof loadError === 'string'
              ? loadError
              : loadError.message || 'Failed to load entity page';
          setError(errorMessage);
          setLoading(false);
          return;
        }

        if (data && data.content) {
          setContent(data.content);
        } else {
          // New entity page - start with template
          setContent(`<h1>${title}</h1><p>Start writing...</p>`);
        }
      } catch (err) {
        console.error('Error loading entity page:', err);
        setError(err.message || 'Failed to load entity page');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [entityId, entityType, title]);

  // Load linked annotations
  useEffect(() => {
    async function loadAnnotations() {
      if (!entityId || !entityType) return;

      try {
        setLoadingAnnotations(true);
        const { data } = await getAnnotationsForEntity(entityId, entityType);
        setLinkedAnnotations(data || []);
      } catch (err) {
        console.error('Error loading linked annotations:', err);
      } finally {
        setLoadingAnnotations(false);
      }
    }

    loadAnnotations();
  }, [entityId, entityType]);

  // Auto-save handler (debounced)
  const handleContentChange = useCallback(
    (newContent) => {
      setContent(newContent);

      // Mark tab as dirty
      if (tabId) {
        updateTab(tabId, { isDirty: true });
      }

      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      const timeout = setTimeout(async () => {
        if (!entityId) return;

        try {
          setSaving(true);
          setError(null);
          const { error: saveError } = await updateEntityPage(
            entityId,
            newContent,
            false, // replace mode
            { projectId, entityType, title } // for creating new pages
          );

          if (saveError) {
            // Handle error object properly
            const errorMessage =
              typeof saveError === 'string'
                ? saveError
                : saveError.message || 'Failed to save changes';
            setError(errorMessage);
            setSaving(false);
            return;
          }

          // Mark tab as clean after successful save
          if (tabId) {
            updateTab(tabId, { isDirty: false });
          }
        } catch (err) {
          console.error('Error saving entity page:', err);
          setError(err.message || 'Failed to save changes');
        } finally {
          setSaving(false);
        }
      }, 0); // Instant save

      setSaveTimeout(timeout);
    },
    [entityId, saveTimeout, tabId, updateTab]
  );

  // Handle location changes (lat/lng)
  const handleLocationChange = useCallback(
    async (field, value) => {
      if (!entityId || !entityData) return;

      const numValue = value === '' ? null : parseFloat(value);

      // Update local state immediately
      setEntityData((prev) => ({
        ...prev,
        [field]: numValue,
      }));

      // Mark tab as dirty
      if (tabId) {
        updateTab(tabId, { isDirty: true });
      }

      // Save to backend
      try {
        setSaving(true);
        const updateCommandMap = {
          person: { command: 'update_person', param: 'person_id' },
          event: { command: 'update_event', param: 'event_id' },
          theory: { command: 'update_theory', param: 'theory_id' },
          place: { command: 'update_place', param: 'place_id' },
          artifact: { command: 'update_artifact', param: 'artifact_id' },
        };

        const config = updateCommandMap[entityType];
        if (config) {
          await invoke(config.command, {
            [config.param]: entityId,
            input: { [field]: numValue },
          });

          // Mark tab as clean after successful save
          if (tabId) {
            updateTab(tabId, { isDirty: false });
          }
        }
      } catch (err) {
        console.error('Error updating location:', err);
        setError(err.message || 'Failed to update location');
      } finally {
        setSaving(false);
      }
    },
    [entityId, entityData, entityType, tabId, updateTab]
  );

  // Handle "Set on Map" button click
  const handleSetOnMap = useCallback(() => {
    if (!entityId || !entityType) return;

    const startLocationPlacement = useStore.getState().startLocationPlacement;
    const setActiveTab = useStore.getState().setActiveTab;

    // Enter location placement mode
    startLocationPlacement(entityId, entityType, title);

    // Switch to map tab
    setActiveTab('default-map');
  }, [entityId, entityType, title]);

  // Handle annotation click - navigate to PDF
  const handleAnnotationClick = useCallback(
    (annotation) => {
      // Find the source for this annotation
      const source = sources.find((s) => s.id === annotation.source_id);
      if (!source) {
        console.error('Source not found for annotation:', annotation.source_id);
        return;
      }

      // Check if there's already a tab open for this source
      let pdfTab = tabs.find((t) => t.type === 'pdf' && t.data?.source?.id === source.id);

      if (!pdfTab) {
        // Create a new PDF tab
        addTab({
          type: 'pdf',
          title: source.title,
          data: { source },
        });

        // The new tab will be the active one after addTab
        pdfTab = useStore
          .getState()
          .tabs.find((t) => t.type === 'pdf' && t.data?.source?.id === source.id);
      } else {
        // Switch to existing tab
        setActiveTab(pdfTab.id);
      }

      // Navigate to the annotation's page
      setCurrentPage(annotation.page_number);
    },
    [sources, tabs, addTab, setActiveTab, setCurrentPage]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  if (loading) {
    return (
      <div className="entity-page">
        <div className="entity-page-header">
          <div className="entity-page-title">
            <span className="entity-type-badge">
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </span>
            <h2>{title}</h2>
          </div>
          {onClose && (
            <button className="entity-page-close" onClick={onClose} title="Close">
              ✕
            </button>
          )}
        </div>
        <div className="entity-page-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entity-page">
        <div className="entity-page-header">
          <div className="entity-page-title">
            <span className="entity-type-badge">
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </span>
            <h2>{title}</h2>
          </div>
          {onClose && (
            <button className="entity-page-close" onClick={onClose} title="Close">
              ✕
            </button>
          )}
        </div>
        <div className="entity-page-error">
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <div className="entity-page-title">
          <span className="entity-type-badge">
            {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </span>
          <h2>{title}</h2>
        </div>
        <div className="entity-page-actions">
          {saving && <span className="save-indicator">Saving...</span>}
          {onClose && (
            <button className="entity-page-close" onClick={onClose} title="Close">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Entity Metadata */}
      {entityData && (
        <div className="entity-metadata">
          {entityType === 'person' && (
            <>
              {entityData.occupation && (
                <div className="metadata-field">
                  <strong>Occupation:</strong> {entityData.occupation}
                </div>
              )}
              {entityData.birth_date && (
                <div className="metadata-field">
                  <strong>Birth:</strong> {entityData.birth_date}
                </div>
              )}
              {entityData.death_date && (
                <div className="metadata-field">
                  <strong>Death:</strong> {entityData.death_date}
                </div>
              )}
              {entityData.description && (
                <div className="metadata-field">
                  <strong>Description:</strong> {entityData.description}
                </div>
              )}
              <div className="metadata-field location-field">
                <strong>Location:</strong>
                <div className="location-inputs">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude"
                    value={entityData.lat || ''}
                    onChange={(e) => handleLocationChange('lat', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude"
                    value={entityData.lng || ''}
                    onChange={(e) => handleLocationChange('lng', e.target.value)}
                  />
                  <button onClick={() => handleSetOnMap()} className="set-on-map-btn">
                    📍 Set on Map
                  </button>
                </div>
              </div>
            </>
          )}
          {entityType === 'place' && (
            <>
              {entityData.place_type && (
                <div className="metadata-field">
                  <strong>Type:</strong> {entityData.place_type}
                </div>
              )}
              {entityData.description && (
                <div className="metadata-field">
                  <strong>Description:</strong> {entityData.description}
                </div>
              )}
              <div className="metadata-field location-field">
                <strong>Coordinates:</strong>
                <div className="location-inputs">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude"
                    value={entityData.lat || ''}
                    onChange={(e) => handleLocationChange('lat', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude"
                    value={entityData.lng || ''}
                    onChange={(e) => handleLocationChange('lng', e.target.value)}
                  />
                  <button onClick={() => handleSetOnMap()} className="set-on-map-btn">
                    📍 Set on Map
                  </button>
                </div>
              </div>
            </>
          )}
          {entityType === 'artifact' && (
            <>
              {entityData.category && (
                <div className="metadata-field">
                  <strong>Category:</strong> {entityData.category}
                </div>
              )}
              {entityData.date_range && (
                <div className="metadata-field">
                  <strong>Date Range:</strong> {entityData.date_range}
                </div>
              )}
              {entityData.owner_name && (
                <div className="metadata-field">
                  <strong>Owner:</strong> {entityData.owner_name}
                  {entityData.owner_type && ` (${entityData.owner_type})`}
                </div>
              )}
              {entityData.description && (
                <div className="metadata-field">
                  <strong>Description:</strong> {entityData.description}
                </div>
              )}
              <div className="metadata-field location-field">
                <strong>Location:</strong>
                <div className="location-inputs">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude"
                    value={entityData.lat || ''}
                    onChange={(e) => handleLocationChange('lat', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude"
                    value={entityData.lng || ''}
                    onChange={(e) => handleLocationChange('lng', e.target.value)}
                  />
                  <button onClick={() => handleSetOnMap()} className="set-on-map-btn">
                    📍 Set on Map
                  </button>
                </div>
              </div>
            </>
          )}
          {entityType === 'event' && (
            <>
              {entityData.event_date && (
                <div className="metadata-field">
                  <strong>Date:</strong> {entityData.event_date}
                </div>
              )}
              {entityData.location && (
                <div className="metadata-field">
                  <strong>Location:</strong> {entityData.location}
                </div>
              )}
              {entityData.description && (
                <div className="metadata-field">
                  <strong>Description:</strong> {entityData.description}
                </div>
              )}
              <div className="metadata-field location-field">
                <strong>Coordinates:</strong>
                <div className="location-inputs">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude"
                    value={entityData.lat || ''}
                    onChange={(e) => handleLocationChange('lat', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude"
                    value={entityData.lng || ''}
                    onChange={(e) => handleLocationChange('lng', e.target.value)}
                  />
                  <button onClick={() => handleSetOnMap()} className="set-on-map-btn">
                    📍 Set on Map
                  </button>
                </div>
              </div>
            </>
          )}
          {entityType === 'theory' && (
            <>
              {entityData.description && (
                <div className="metadata-field">
                  <strong>Description:</strong> {entityData.description}
                </div>
              )}
              <div className="metadata-field location-field">
                <strong>Location:</strong>
                <div className="location-inputs">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitude"
                    value={entityData.lat || ''}
                    onChange={(e) => handleLocationChange('lat', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitude"
                    value={entityData.lng || ''}
                    onChange={(e) => handleLocationChange('lng', e.target.value)}
                  />
                  <button onClick={() => handleSetOnMap()} className="set-on-map-btn">
                    📍 Set on Map
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Linked Annotations */}
      {(linkedAnnotations.length > 0 || loadingAnnotations) && (
        <div className="entity-linked-annotations">
          <h3>Linked Source References</h3>
          {loadingAnnotations ? (
            <div className="loading-annotations">Loading references...</div>
          ) : (
            <div className="annotations-list">
              {linkedAnnotations.map((annotation) => {
                const source = sources.find((s) => s.id === annotation.source_id);
                const annotationTypeIcon =
                  annotation.annotation_type === 'highlight'
                    ? '🖍️'
                    : annotation.annotation_type === 'text'
                      ? '📝'
                      : '✏️';

                return (
                  <div
                    key={annotation.id}
                    className="annotation-item"
                    onClick={() => handleAnnotationClick(annotation)}
                    title="Click to view in PDF"
                  >
                    <div className="annotation-icon">{annotationTypeIcon}</div>
                    <div className="annotation-details">
                      <div className="annotation-source">
                        {source?.title || 'Unknown Source'} · Page {annotation.page_number}
                      </div>
                      {annotation.content && (
                        <div className="annotation-content">
                          {annotation.content.length > 150
                            ? `${annotation.content.substring(0, 150)}...`
                            : annotation.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="entity-page-content">
        <RichTextEditor
          key={entityId || 'new'} // Stable key based on entity, not content
          content={content}
          onChange={handleContentChange}
          placeholder={`Write about ${title}...`}
        />
      </div>
    </div>
  );
}
