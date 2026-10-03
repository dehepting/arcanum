import { useState, useEffect, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import EntityMetadataField from './EntityMetadataField';
import { getEntityPage, updateEntityPage } from '../lib/entityPages';
import { getAnnotationsForEntity } from '../lib/annotationLinks';
import { entityMetadataSchemas } from '../lib/entityMetadataSchemas';
import { invoke } from '@tauri-apps/api/core';
import useStore from '../store/useStore';
import { GET_COMMANDS, UPDATE_COMMANDS } from '../config/entityCommands';
import '../styles/entity.css';

/**
 * EntityPage - Display and edit entity page content
 * Features:
 * - Rich text editing with Tiptap
 * - Inline metadata editing
 * - Auto-save (debounced 500ms)
 * - Field validation
 * - Collapsible sections
 * - Loading states
 * - Error handling
 */
export default function EntityPage({ entityId, entityType, title, projectId, tabId, onClose }) {
  const [content, setContent] = useState('');
  const [entityData, setEntityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [linkedAnnotations, setLinkedAnnotations] = useState([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(new Set());

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
        const commandMap = GET_COMMANDS;

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

  // Auto-save handler (debounced 500ms)
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

      // Set new timeout for auto-save (500ms debounce)
      const timeout = setTimeout(async () => {
        if (!entityId) return;

        try {
          setSaving(true);
          setSaveSuccess(false);
          setError(null);
          const { error: saveError } = await updateEntityPage(entityId, newContent, false, {
            projectId,
            entityType,
            title,
          });

          if (saveError) {
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

          // Show success indicator briefly
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
          console.error('Error saving entity page:', err);
          setError(err.message || 'Failed to save changes');
        } finally {
          setSaving(false);
        }
      }, 500); // 500ms debounce

      setSaveTimeout(timeout);
    },
    [entityId, saveTimeout, tabId, updateTab, projectId, entityType, title]
  );

  // Handle metadata field changes
  const handleMetadataChange = useCallback(
    async (field, value) => {
      if (!entityId || !entityData) return;

      // Convert empty strings to null for optional fields
      const processedValue = value === '' ? null : value;

      // Update local state immediately
      setEntityData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));

      // Mark tab as dirty
      if (tabId) {
        updateTab(tabId, { isDirty: true });
      }

      // Save to backend
      try {
        setSaving(true);
        setSaveSuccess(false);
        const updateCommandMap = UPDATE_COMMANDS;

        const config = updateCommandMap[entityType];
        if (config) {
          await invoke(config.command, {
            [config.param]: entityId,
            input: { [field]: processedValue },
          });

          // Mark tab as clean after successful save
          if (tabId) {
            updateTab(tabId, { isDirty: false });
          }

          // Show success indicator briefly
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } catch (err) {
        console.error('Error updating metadata:', err);
        setError(err.message || 'Failed to update metadata');
        // Revert local state on error
        setEntityData((prev) => ({
          ...prev,
          [field]: entityData[field],
        }));
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

    startLocationPlacement(entityId, entityType, title);
    setActiveTab('default-map');
  }, [entityId, entityType, title]);

  // Handle "View on Map" button click
  const handleViewOnMap = useCallback(() => {
    if (!entityData?.lat || !entityData?.lng) return;

    const setActiveTab = useStore.getState().setActiveTab;
    setActiveTab('default-map');

    // Set a flag to fly to this location
    useStore.getState().flyToCoordinates = {
      lat: entityData.lat,
      lng: entityData.lng,
      zoom: 12,
    };
  }, [entityData]);

  // Handle annotation click - navigate to PDF
  const handleAnnotationClick = useCallback(
    (annotation) => {
      const source = sources.find((s) => s.id === annotation.source_id);
      if (!source) {
        console.error('Source not found for annotation:', annotation.source_id);
        return;
      }

      let pdfTab = tabs.find((t) => t.type === 'pdf' && t.data?.source?.id === source.id);

      if (!pdfTab) {
        addTab({
          type: 'pdf',
          title: source.title,
          data: { source },
        });

        pdfTab = useStore
          .getState()
          .tabs.find((t) => t.type === 'pdf' && t.data?.source?.id === source.id);
      } else {
        setActiveTab(pdfTab.id);
      }

      setCurrentPage(annotation.page_number);
    },
    [sources, tabs, addTab, setActiveTab, setCurrentPage]
  );

  // Toggle section collapsed state
  const toggleSection = (sectionTitle) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

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
            <span className="entity-type-badge" data-type={entityType}>
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
            <span className="entity-type-badge" data-type={entityType}>
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

  const schema = entityMetadataSchemas[entityType];
  const hasCoordinates = entityData?.lat && entityData?.lng;

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
          {saving && <span className="save-indicator saving">Saving...</span>}
          {saveSuccess && <span className="save-indicator success">✓ Saved</span>}
          {onClose && (
            <button className="entity-page-close" onClick={onClose} title="Close">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Entity Metadata - Schema-driven */}
      {entityData && schema && (
        <div className="entity-metadata-sections">
          {schema.groups.map((group) => {
            const isCollapsed = collapsedSections.has(group.title);
            const isLocationSection = group.title === 'Location' || group.title === 'Coordinates';

            return (
              <div key={group.title} className="metadata-section">
                <div className="metadata-section-header" onClick={() => toggleSection(group.title)}>
                  <span className="metadata-section-icon">{group.icon}</span>
                  <h3>{group.title}</h3>
                  <span className="metadata-section-toggle">{isCollapsed ? '▸' : '▾'}</span>
                </div>

                {!isCollapsed && (
                  <div className="metadata-section-content">
                    {group.fields.map((field) => (
                      <EntityMetadataField
                        key={field.key}
                        label={field.label}
                        value={entityData[field.key]}
                        onChange={(value) => handleMetadataChange(field.key, value)}
                        type={field.type}
                        icon={field.icon}
                        placeholder={field.placeholder}
                        validation={field.validation}
                        options={field.options}
                        multiline={field.multiline}
                        clearable={field.clearable}
                      />
                    ))}

                    {/* Map buttons for location sections */}
                    {isLocationSection && (
                      <div className="metadata-map-actions">
                        <button onClick={handleSetOnMap} className="set-on-map-btn">
                          📍 Set on Map
                        </button>
                        {hasCoordinates && (
                          <button onClick={handleViewOnMap} className="view-on-map-btn">
                            🗺️ View on Map
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Linked Annotations - Always show */}
      <div className="entity-linked-annotations">
        <div className="metadata-section-header" onClick={() => toggleSection('Source References')}>
          <span className="metadata-section-icon">📎</span>
          <h3>Linked Source References</h3>
          <span className="metadata-section-toggle">
            {collapsedSections.has('Source References') ? '▸' : '▾'}
          </span>
        </div>

        {!collapsedSections.has('Source References') && (
          <div className="metadata-section-content">
            {loadingAnnotations ? (
              <div className="loading-annotations">Loading references...</div>
            ) : linkedAnnotations.length === 0 ? (
              <div className="empty-annotations">
                <p>No source references linked yet.</p>
                <p className="empty-annotations-hint">
                  Link annotations to this entity from PDF documents to see them here.
                </p>
              </div>
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
      </div>

      <div className="entity-page-content">
        <RichTextEditor
          key={entityId || 'new'}
          content={content}
          onChange={handleContentChange}
          placeholder={`Write about ${title}...`}
        />
      </div>
    </div>
  );
}
