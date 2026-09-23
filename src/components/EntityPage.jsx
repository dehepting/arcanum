import { useState, useEffect, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import { getEntityPage, updateEntityPage } from '../lib/entityPages';
import { invoke } from '@tauri-apps/api/core';
import useStore from '../store/useStore';
import './EntityPage.css';

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
  console.log('EntityPage render:', { entityId, entityType, title, projectId, tabId });

  const [content, setContent] = useState('');
  const [entityData, setEntityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const updateTab = useStore((state) => state.updateTab);

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
          person: 'get_person',
          event: 'get_event',
          theory: 'get_theory',
          place: 'get_place',
          artifact: 'get_artifact',
        };

        const command = commandMap[entityType];
        if (command) {
          try {
            const metadata = await invoke(command, { id: entityId });
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
  }, [entityId, title]);

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
            <span className="entity-type-badge">{entityType}</span>
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
            <span className="entity-type-badge">{entityType}</span>
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
          <span className="entity-type-badge">{entityType}</span>
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
            </>
          )}
          {entityType === 'place' && (
            <>
              {(entityData.lat || entityData.lng) && (
                <div className="metadata-field">
                  <strong>Coordinates:</strong> {entityData.lat}, {entityData.lng}
                </div>
              )}
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
            </>
          )}
          {entityType === 'theory' && (
            <>
              {entityData.description && (
                <div className="metadata-field">
                  <strong>Description:</strong> {entityData.description}
                </div>
              )}
            </>
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
