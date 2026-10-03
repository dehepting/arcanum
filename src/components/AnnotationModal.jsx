import { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';
import ArtifactLinkModal from './ArtifactLinkModal';
import EntityPicker from './canvas/EntityPicker';
import { getArtifactsForAnnotation } from '../lib/artifact-sources';
import {
  getEntitiesForAnnotation,
  linkAnnotationToEntity,
  unlinkAnnotationFromEntity,
} from '../lib/annotationLinks';
import { createAnnotation, updateAnnotation } from '../lib/tauri';

export default function AnnotationModal() {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showArtifactLinkModal, setShowArtifactLinkModal] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [linkedArtifacts, setLinkedArtifacts] = useState([]);
  const [linkedEntities, setLinkedEntities] = useState([]);

  const modalOpen = useStore((state) => state.annotationModalOpen);
  const pendingAnnotation = useStore((state) => state.pendingAnnotation);
  const closeModal = useStore((state) => state.closeAnnotationModal);
  const addAnnotation = useStore((state) => state.addAnnotation);
  const setAnnotations = useStore((state) => state.setAnnotations);
  const annotations = useStore((state) => state.annotations);
  const currentPage = useStore((state) => state.currentPage);
  const activeSourceId = useStore((state) => state.activeSourceId);
  const currentProject = useStore((state) => state.currentProject);
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
      setLinkedArtifacts(result.data || []);
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

  // Shared save logic - returns the annotation ID (new or existing)
  const saveAnnotation = async () => {
    if (!pendingAnnotation) return null;

    // Text annotations require text
    if (pendingAnnotation.type === 'text' && !noteText.trim()) {
      alert('Please enter some text for the note');
      return null;
    }

    // Check if editing existing annotation
    if (pendingAnnotation.id) {
      // Update existing
      const data = await updateAnnotation(pendingAnnotation.id, {
        text: noteText.trim(),
      });

      // Update in store using the annotations from component state (not direct store access)
      setAnnotations(annotations.map((a) => (a.id === data.id ? data : a)));
      return data.id;
    } else {
      // Create new
      const annotationData = {
        source_id: activeSourceId,
        project_id: currentProject?.id,
        page_number: currentPage,
        annotation_type: pendingAnnotation.type || 'text',
        rect: {
          x: pendingAnnotation.rect.x,
          y: pendingAnnotation.rect.y,
          w: pendingAnnotation.rect.w,
          h: pendingAnnotation.rect.h,
        },
        text: noteText.trim(),
      };

      const data = await createAnnotation(annotationData);
      addAnnotation(data);
      return data.id;
    }
  };

  const handleSave = async () => {
    if (!pendingAnnotation) return;

    setSaving(true);
    try {
      const annotationId = await saveAnnotation();
      if (annotationId) {
        handleClose();
      }
    } catch (err) {
      console.error('Failed to save annotation:', err);
      alert(
        `Failed to save annotation: ${typeof err === 'string' ? err : err.message || JSON.stringify(err)}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    // Auto-save if there's content (for text annotations) or if editing existing
    const hasContent = noteText.trim().length > 0;
    const isNewTextAnnotation = !pendingAnnotation?.id && pendingAnnotation?.type === 'text';

    if (hasContent && (isNewTextAnnotation || pendingAnnotation?.id)) {
      // Auto-save before closing
      try {
        await saveAnnotation();
      } catch (err) {
        console.error('Auto-save failed:', err);
        // Still close even if save fails
      }
    }

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

    setSaving(true);
    try {
      const annotationId = await saveAnnotation();
      if (annotationId) {
        // Close modal and start pin placement with the annotation ID
        handleClose();
        startPinPlacement(annotationId);
      }
    } catch (err) {
      console.error('Failed to save annotation:', err);
      alert(
        `Failed to save annotation: ${typeof err === 'string' ? err : err.message || JSON.stringify(err)}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={modalOpen} onClose={handleClose} maxWidth="420px">
      <ModalHeader>Add Note</ModalHeader>
      <ModalBody>
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
      </ModalBody>

      <ModalFooter>
        <div
          style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%' }}
        >
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
      </ModalFooter>

      {showEntityPicker && (
        <EntityPicker onSelect={handleEntitySelected} onClose={() => setShowEntityPicker(false)} />
      )}

      {showArtifactLinkModal && (
        <ArtifactLinkModal
          annotationId={pendingAnnotation?.id}
          onClose={() => setShowArtifactLinkModal(false)}
          onLinked={() => loadLinkedArtifacts(pendingAnnotation?.id)}
        />
      )}
    </Modal>
  );
}
