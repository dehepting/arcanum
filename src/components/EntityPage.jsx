import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { getEntityPage, updateEntityPage } from '../lib/entityPages';
import { invoke } from '@tauri-apps/api/core';
import useStore from '../store/useStore';
import { showError } from '../utils/errorHandling';
import { getEntityTypeConfig } from '../config/entityTypes';
import EntityMetadataSection from './EntityMetadataSection';
import './EntityPage.css';

// Lazy load heavy TipTap rich text editor
const RichTextEditor = lazy(() => import('./RichTextEditor'));

/**
 * EntityPage - Display and edit entity page content
 * Refactored to use entity type configuration and reusable components
 */
export default function EntityPage({ entityId, entityType, title, projectId, tabId, onClose }) {
  const [content, setContent] = useState('');
  const [entityData, setEntityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const updateTab = useStore((state) => state.updateTab);

  // Get entity type configuration
  const config = getEntityTypeConfig(entityType);

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

        // Load entity metadata using entity type config
        try {
          const metadata = await invoke(config.getCommand, { [config.paramKey]: entityId });
          setEntityData(metadata);
        } catch (metadataError) {
          showError(
            `Failed to load ${config.label} metadata: ${metadataError.message || 'Unknown error'}`
          );
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
        const errorMessage = err.message || 'Failed to load entity page';
        setError(errorMessage);
        showError(`Failed to load ${config.label}: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [entityId, entityType, title, config]);

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
            showError(`Failed to save ${config.label}: ${errorMessage}`);
            setSaving(false);
            return;
          }

          // Mark tab as clean after successful save
          if (tabId) {
            updateTab(tabId, { isDirty: false });
          }

          setError(null);
        } catch (err) {
          const errorMessage = err.message || 'Failed to save changes';
          setError(errorMessage);
          showError(`Failed to save ${config.label}: ${errorMessage}`);
        } finally {
          setSaving(false);
        }
      }, 0); // Instant save

      setSaveTimeout(timeout);
    },
    [entityId, saveTimeout, tabId, updateTab, projectId, entityType, title, config]
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

      // Save to backend using entity type config
      try {
        setSaving(true);
        await invoke(config.updateCommand, {
          [config.paramKey]: entityId,
          input: { [field]: numValue },
        });

        // Mark tab as clean after successful save
        if (tabId) {
          updateTab(tabId, { isDirty: false });
        }
      } catch (err) {
        showError(`Failed to update location: ${err.message || 'Unknown error'}`);
        setError(err.message || 'Failed to update location');
      } finally {
        setSaving(false);
      }
    },
    [entityId, entityData, tabId, updateTab, config]
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
            <span className="entity-type-badge">{config.label}</span>
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
            <span className="entity-type-badge">{config.label}</span>
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
          <span className="entity-type-badge">{config.label}</span>
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

      {/* Entity Metadata - Uses configuration-based component */}
      <EntityMetadataSection
        entityType={entityType}
        entityData={entityData}
        entityId={entityId}
        entityTitle={title}
        onLocationChange={handleLocationChange}
        onSetOnMap={handleSetOnMap}
        saving={saving}
      />

      <div className="entity-page-content">
        <Suspense
          fallback={
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
              <p>Loading editor...</p>
            </div>
          }
        >
          <RichTextEditor
            key={entityId || 'new'}
            content={content}
            onChange={handleContentChange}
            placeholder={`Write about ${title}...`}
          />
        </Suspense>
      </div>
    </div>
  );
}
