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
import type { Annotation } from '../types/annotations';

interface LinkedEntity {
  id: string;
  name: string;
  entity_type: string;
  [key: string]: any;
}

interface LinkedArtifact {
  id: string;
  name: string;
  [key: string]: any;
}

interface EntitySelection {
  entityId: string;
  entityType: string;
  entityName: string;
}

export default function AnnotationModal() {
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showArtifactLinkModal, setShowArtifactLinkModal] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [_linkedArtifacts, setLinkedArtifacts] = useState<LinkedArtifact[]>([]);
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([]);

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

  const loadLinkedArtifacts = useCallback(async (annotationId: string) => {
    const result = await getArtifactsForAnnotation(annotationId);
    if (result.success) {
      setLinkedArtifacts(result.data || []);
    }
  }, []);

  const loadLinkedEntities = useCallback(async (annotationId: string) => {
    const result = await getEntitiesForAnnotation(annotationId);
    if (result.success) {
      setLinkedEntities((result.data || []) as any);
    }
  }, []);

  useEffect(() => {
    if (modalOpen && pendingAnnotation) {
      console.log('Opening modal with annotation:', pendingAnnotation);
      // If editing existing annotation
      if (pendingAnnotation.id) {
        setNoteText((pendingAnnotation as any).text || '');
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
  const saveAnnotation = async (): Promise<string | null> => {
    if (!pendingAnnotation) return null;

    // Text annotations require text
    if ((pendingAnnotation as any).type === 'text' && !noteText.trim()) {
      alert('Please enter some text for the note');
      return null;
    }

    // Check if editing existing annotation
    if (pendingAnnotation.id) {
      // Update existing
      const data = await updateAnnotation(pendingAnnotation.id, {
        text: noteText.trim(),
      } as any);

      // Update in store using the annotations from component state (not direct store access)
      setAnnotations(annotations.map((a) => (a.id === data.id ? data : a)));
      return data.id;
    } else {
      // Create new
      const annotationData: any = {
        source_id: activeSourceId,
        project_id: currentProject?.id,
        page_number: currentPage,
        annotation_type: (pendingAnnotation as any).type || 'text',
        rect: {
          x: (pendingAnnotation as any).rect.x,
          y: (pendingAnnotation as any).rect.y,
          w: (pendingAnnotation as any).rect.w,
          h: (pendingAnnotation as any).rect.h,
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
        `Failed to save annotation: ${typeof err === 'string' ? err : (err as Error).message || JSON.stringify(err)}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    // Auto-save if there's content (for text annotations) or if editing existing
    const hasContent = noteText.trim().length > 0;
    const isNewTextAnnotation =
      !pendingAnnotation?.id && (pendingAnnotation as any)?.type === 'text';

    if (hasContent && (isNewTextAnnotation || pendingAnnotation?.id)) {
      // Auto-save before closing
      try {
        await saveAnnotation();
      } catch (err) {
        console.error('Auto-save failed:', err);
        // Still close even if save fails
      }
    }

    closeModal();
  };

  const handleLinkToMap = async () => {
    if (!pendingAnnotation) return;

    setSaving(true);
    try {
      // Save annotation first if it's new
      let annotationId = pendingAnnotation.id;
      if (!annotationId) {
        annotationId = await saveAnnotation();
        if (!annotationId) return; // Save failed
      }

      // Close modal and enter pin placement mode
      closeModal();
      startPinPlacement(annotationId);
    } catch (err) {
      console.error('Failed to prepare for map linking:', err);
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkEntity = async (selection: EntitySelection) => {
    if (!pendingAnnotation) return;

    // Save annotation first if it's new
    let annotationId = pendingAnnotation.id;
    if (!annotationId) {
      annotationId = await saveAnnotation();
      if (!annotationId) return; // Save failed
    }

    // Link the entity
    const result = await linkAnnotationToEntity(
      annotationId,
      selection.entityId,
      selection.entityType as any,
      'mentions'
    );

    if (result.success) {
      // Reload linked entities
      await loadLinkedEntities(annotationId);
    } else {
      alert(`Failed to link entity: ${result.error}`);
    }

    setShowEntityPicker(false);
  };

  const handleUnlinkEntity = async (entityId: string) => {
    if (!pendingAnnotation?.id) return;

    const result = await unlinkAnnotationFromEntity(pendingAnnotation.id, entityId);
    if (result.success) {
      await loadLinkedEntities(pendingAnnotation.id);
    } else {
      alert(`Failed to unlink entity: ${result.error}`);
    }
  };

  const handleArtifactLinked = async (_artifactId: string) => {
    if (pendingAnnotation?.id) {
      await loadLinkedArtifacts(pendingAnnotation.id);
    }
    setShowArtifactLinkModal(false);
  };

  // Get entity details from store
  const getEntityDetails = (entityId: string, entityType: string) => {
    let entityList: any[] = [];
    switch (entityType) {
      case 'person':
      case 'people':
        entityList = people;
        break;
      case 'event':
      case 'events':
        entityList = events;
        break;
      case 'theory':
      case 'theories':
        entityList = theories;
        break;
      case 'place':
      case 'places':
        entityList = places;
        break;
      case 'artifact':
      case 'artifacts':
        entityList = artifacts;
        break;
    }

    const entity = entityList.find((e) => e.id === entityId);
    return entity
      ? { id: entity.id, name: entity.name, type: entityType }
      : { id: entityId, name: 'Unknown', type: entityType };
  };

  if (!modalOpen) return null;

  const annotationType = (pendingAnnotation as any)?.type || 'text';

  return (
    <>
      <Modal isOpen={modalOpen} onClose={handleClose} maxWidth="500px">
        <ModalHeader>
          {pendingAnnotation?.id ? 'Edit' : 'New'} Annotation
          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            ({annotationType})
          </span>
        </ModalHeader>

        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Note Text */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--text)',
                }}
              >
                Note
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add your notes here..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Linked Entities */}
            {pendingAnnotation?.id && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    Linked Entities
                  </label>
                  <button
                    onClick={() => setShowEntityPicker(true)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      background: 'var(--bg)',
                      border: '1px solid var(--line)',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      color: 'var(--text)',
                    }}
                  >
                    + Link Entity
                  </button>
                </div>

                {linkedEntities.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {linkedEntities.map((link) => {
                      const entity = getEntityDetails(link.entity_id, link.entity_type);
                      return (
                        <div
                          key={link.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            background: 'var(--accent-2)',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          <span>{entity.name}</span>
                          <button
                            onClick={() => handleUnlinkEntity(link.entity_id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontSize: '14px',
                              opacity: 0.8,
                            }}
                            title="Unlink"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                  >
                    No entities linked
                  </div>
                )}
              </div>
            )}

            {/* Link to Map Button */}
            <button
              onClick={handleLinkToMap}
              disabled={saving}
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text)',
              }}
            >
              📍 Link to Map
            </button>
          </div>
        </ModalBody>

        <ModalFooter>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button onClick={handleClose} className="btn" disabled={saving}>
              Close
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Entity Picker Modal */}
      {showEntityPicker && (
        <EntityPicker onSelect={handleLinkEntity} onClose={() => setShowEntityPicker(false)} />
      )}

      {/* Artifact Link Modal */}
      {showArtifactLinkModal && pendingAnnotation && (
        <ArtifactLinkModal
          annotation={pendingAnnotation}
          onClose={() => setShowArtifactLinkModal(false)}
          onLink={handleArtifactLinked}
        />
      )}
    </>
  );
}
