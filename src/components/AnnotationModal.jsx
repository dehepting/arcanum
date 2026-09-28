import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import ArtifactLinkModal from './ArtifactLinkModal';
import EntityPicker from './canvas/EntityPicker';
import { getArtifactsForAnnotation } from '../lib/artifact-sources';
import {
  getEntitiesForAnnotation,
  linkAnnotationToEntity,
  unlinkAnnotationFromEntity,
} from '../lib/annotationLinks';

export default function AnnotationModal() {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showArtifactLinkModal, setShowArtifactLinkModal] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [linkedArtifacts, setLinkedArtifacts] = useState([]);
  const [linkedEntities, setLinkedEntities] = useState([]);
  const [selectedEntityType, setSelectedEntityType] = useState('person');

  const modalOpen = useStore((state) => state.annotationModalOpen);
  const pendingAnnotation = useStore((state) => state.pendingAnnotation);
  const closeModal = useStore((state) => state.closeAnnotationModal);
  const addAnnotation = useStore((state) => state.addAnnotation);
  const currentPage = useStore((state) => state.currentPage);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const startPinPlacement = useStore((state) => state.startPinPlacement);

  // Get entity stores for displaying linked entities
  const people = useStore((state) => state.people);
  const events = useStore((state) => state.events);
  const theories = useStore((state) => state.theories);
  const places = useStore((state) => state.places);
  const artifacts = useStore((state) => state.artifacts);

  const loadLinkedArtifacts = useCallback(async (annotationId) => {
    const result = await getArtifactsForAnnotation(annotationId);
    if (result.success) {
      setLinkedArtifacts(result.data);
    }
  }, []);

  const loadLinkedEntities = useCallback(async (annotationId) => {
    const result = await getEntitiesForAnnotation(annotationId);
    if (result.success) {
      setLinkedEntities(result.data || []);
    }
  }, []);

  useEffect(() => {
    if (modalOpen && pendingAnnotation) {
      console.log('Opening modal with annotation:', pendingAnnotation);
      // If editing existing annotation
      if (pendingAnnotation.id) {
        setNoteText(pendingAnnotation.text || '');
        loadLinkedArtifacts(pendingAnnotation.id);
        loadLinkedEntities(pendingAnnotation.id);
      } else {
        // New annotation
        setNoteText('');
        setLinkedArtifacts([]);
        setLinkedEntities([]);
      }
    } else if (!modalOpen) {
      setNoteText('');
      setLinkedArtifacts([]);
      setLinkedEntities([]);
    }
  }, [modalOpen, pendingAnnotation, loadLinkedArtifacts, loadLinkedEntities]);

  const handleSave = async () => {
    if (!pendingAnnotation) return;

    // Text annotations require text
    if (pendingAnnotation.type === 'text' && !noteText.trim()) {
      alert('Please enter some text for the note');
      return;
    }

    setSaving(true);
    try {
      // Check if editing existing annotation
      if (pendingAnnotation.id) {
        // Update existing
        const { data, error } = await supabase
          .from('annotations')
          .update({ text: noteText.trim() })
          .eq('id', pendingAnnotation.id)
          .select()
          .single();

        if (error) throw error;

        // Update in store
        const currentAnnotations = useStore.getState().annotations;
        useStore
          .getState()
          .setAnnotations(currentAnnotations.map((a) => (a.id === data.id ? data : a)));
      } else {
        // Create new
        const annotationData = {
          source_id: activeSourceId,
          page_number: currentPage,
          type: pendingAnnotation.type || 'text',
          rect_x: pendingAnnotation.rect.x,
          rect_y: pendingAnnotation.rect.y,
          rect_w: pendingAnnotation.rect.w,
          rect_h: pendingAnnotation.rect.h,
          text: noteText.trim(),
        };

        const { data, error } = await supabase
          .from('annotations')
          .insert([annotationData])
          .select()
          .single();

        if (error) throw error;

        addAnnotation(data);
      }

      handleClose();
    } catch (err) {
      console.error('Failed to save annotation:', err);
      alert(`Failed to save annotation: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNoteText('');
    setShowArtifactLinkModal(false);
    setShowEntityPicker(false);
    closeModal();
  };

  const handleOpenArtifactLink = async () => {
    // Save annotation first if it's new
    if (!pendingAnnotation.id) {
      await handleSave();
    }
    setShowArtifactLinkModal(true);
  };

  const handleArtifactLinked = async () => {
    // Reload linked artifacts
    if (pendingAnnotation?.id) {
      await loadLinkedArtifacts(pendingAnnotation.id);
    }
  };

  const handleOpenEntityPicker = async () => {
    // Save annotation first if it's new
    if (!pendingAnnotation.id) {
      await handleSave();
    }
    setShowEntityPicker(true);
  };

  const handleEntitySelected = async ({ entityId, entityType, entityName }) => {
    if (!pendingAnnotation?.id) {
      alert('Please save the annotation first');
      return;
    }

    const result = await linkAnnotationToEntity(
      pendingAnnotation.id,
      entityId,
      entityType,
      'mentions'
    );

    if (result.success) {
      await loadLinkedEntities(pendingAnnotation.id);
      setShowEntityPicker(false);
    } else {
      alert(`Failed to link entity: ${result.error}`);
    }
  };

  const handleUnlinkEntity = async (entityId) => {
    if (!pendingAnnotation?.id) return;

    const result = await unlinkAnnotationFromEntity(pendingAnnotation.id, entityId);

    if (result.success) {
      await loadLinkedEntities(pendingAnnotation.id);
    } else {
      alert(`Failed to unlink entity: ${result.error}`);
    }
  };

  const getEntityDetails = (link) => {
    let entity = null;
    let icon = '';

    switch (link.entity_type) {
      case 'person':
        entity = people.find((p) => p.id === link.entity_id);
        icon = '👤';
        break;
      case 'event':
        entity = events.find((e) => e.id === link.entity_id);
        icon = '📅';
        break;
      case 'theory':
        entity = theories.find((t) => t.id === link.entity_id);
        icon = '💡';
        break;
      case 'place':
        entity = places.find((p) => p.id === link.entity_id);
        icon = '📍';
        break;
      case 'artifact':
        entity = artifacts.find((a) => a.id === link.entity_id);
        icon = '🏺';
        break;
    }

    return {
      name: entity?.name || 'Unknown',
      type: link.entity_type,
      icon,
      relationship: link.relationship_type || 'mentions',
    };
  };

  const handleSaveAndLink = async () => {
    if (!pendingAnnotation) return;

    // Text annotations require text
    if (pendingAnnotation.type === 'text' && !noteText.trim()) {
      alert('Please enter some text for the note');
      return;
    }

    setSaving(true);
    try {
      let annotationId = pendingAnnotation.id;

      // Check if editing existing annotation or creating new
      if (pendingAnnotation.id) {
        // Update existing
        const { data, error } = await supabase
          .from('annotations')
          .update({ text: noteText.trim() })
          .eq('id', pendingAnnotation.id)
          .select()
          .single();

        if (error) throw error;

        const currentAnnotations = useStore.getState().annotations;
        useStore
          .getState()
          .setAnnotations(currentAnnotations.map((a) => (a.id === data.id ? data : a)));
      } else {
        // Create new
        const annotationData = {
          source_id: activeSourceId,
          page_number: currentPage,
          type: pendingAnnotation.type || 'text',
          rect_x: pendingAnnotation.rect.x,
          rect_y: pendingAnnotation.rect.y,
          rect_w: pendingAnnotation.rect.w,
          rect_h: pendingAnnotation.rect.h,
          text: noteText.trim(),
        };

        const { data, error } = await supabase
          .from('annotations')
          .insert([annotationData])
          .select()
          .single();

        if (error) throw error;

        addAnnotation(data);
        annotationId = data.id;
      }

      // Now start pin placement with the annotation ID
      handleClose();
      startPinPlacement(annotationId);
    } catch (err) {
      console.error('Failed to save annotation:', err);
      alert(`Failed to save annotation: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!modalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 92vw)',
          background: 'var(--panel-2)',
          border: '1px solid var(--line)',
          padding: '16px',
          borderRadius: '8px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 10px', fontSize: '16px', fontFamily: 'IBM Plex Serif, serif' }}>
          Add Note
        </h2>

        <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>
          Note (optional)
        </label>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="What does this passage mean?"
          autoFocus
          style={{
            width: '100%',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--line)',
            padding: '8px',
            borderRadius: '4px',
            margin: '6px 0 10px',
            font: 'inherit',
            minHeight: '80px',
            resize: 'vertical',
          }}
        />

        {linkedArtifacts.length > 0 && (
          <div
            style={{
              marginBottom: '10px',
              padding: '8px',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Linked Artifacts:
            </div>
            {linkedArtifacts.map((link) => (
              <div
                key={link.id}
                style={{ fontSize: '12px', padding: '4px 0', color: 'var(--text-muted)' }}
              >
                🏺 {link.artifacts?.name || 'Unknown'}
              </div>
            ))}
          </div>
        )}

        {linkedEntities.length > 0 && (
          <div
            style={{
              marginBottom: '10px',
              padding: '8px',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Linked Entities:
            </div>
            {linkedEntities.map((link) => {
              const details = getEntityDetails(link);
              return (
                <div
                  key={`${link.entity_type}-${link.entity_id}`}
                  style={{
                    fontSize: '12px',
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>
                    {details.icon} {details.name}{' '}
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>({details.type})</span>
                  </span>
                  <button
                    onClick={() => handleUnlinkEntity(link.entity_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      fontSize: '14px',
                    }}
                    title="Unlink"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pendingAnnotation?.id && (
          <>
            <button
              onClick={handleOpenArtifactLink}
              style={{
                width: '100%',
                background: 'var(--panel)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '6px',
                fontSize: '13px',
              }}
            >
              🔗 Link to Artifact
            </button>

            <button
              onClick={handleOpenEntityPicker}
              style={{
                width: '100%',
                background: 'var(--panel)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '13px',
              }}
            >
              🔗 Link to Entity
            </button>
          </>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          <button
            onClick={handleClose}
            style={{
              background: 'var(--panel)',
              color: 'var(--text)',
              border: '1px solid var(--line)',
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Cancel
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                color: 'var(--text)',
                padding: '6px 12px',
                cursor: saving ? 'wait' : 'pointer',
                borderRadius: '4px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleSaveAndLink}
              disabled={saving}
              style={{
                background: 'var(--accent)',
                border: 'var(--accent)',
                color: '#fff',
                padding: '6px 12px',
                cursor: saving ? 'wait' : 'pointer',
                borderRadius: '4px',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save & Link to Map'}
            </button>
          </div>
        </div>
      </div>

      {showArtifactLinkModal && pendingAnnotation?.id && (
        <ArtifactLinkModal
          annotation={pendingAnnotation}
          onClose={() => setShowArtifactLinkModal(false)}
          onLink={handleArtifactLinked}
        />
      )}

      {showEntityPicker && (
        <EntityPicker onSelect={handleEntitySelected} onClose={() => setShowEntityPicker(false)} />
      )}
    </div>
  );
}
