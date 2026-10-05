import { useState, useEffect, type ChangeEvent, type MouseEvent } from 'react';
import useStore from '../store/useStore';
import { logger } from '../utils/logger';
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';
import EntityPicker from './EntityPicker';
import ArtifactLinkModal from './ArtifactLinkModal';
import {
  createAnnotation,
  updateAnnotation,
  linkAnnotationToEntity,
  unlinkAnnotationFromEntity,
  getLinkedEntities,
  linkAnnotationToArtifact,
  unlinkAnnotationFromArtifact,
  getLinkedArtifacts,
} from '../lib/tauri';
import { showError, showSuccess } from '../utils/errorHandling';
import type { Annotation } from '../types/annotations';
import type { Entity } from '../types/entities';

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

type EntityType = 'person' | 'event' | 'theory' | 'place' | 'artifact';

/**
 * AnnotationModal - Create/edit annotations with entity and artifact linking
 * Supports text notes, highlights, and ink annotations
 */
export default function AnnotationModal() {
  const annotationModal = useStore((state) => state.annotationModal);
  const closeAnnotationModal = useStore((state) => state.closeAnnotationModal);
  const currentSource = useStore((state) => state.currentSource);
  const currentProject = useStore((state) => state.currentProject);
  const setAnnotations = useStore((state) => state.setAnnotations);

  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([]);
  const [linkedArtifacts, setLinkedArtifacts] = useState<LinkedArtifact[]>([]);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [entityTypeToLink, setEntityTypeToLink] = useState<EntityType | null>(null);
  const [showArtifactLinkModal, setShowArtifactLinkModal] = useState(false);

  const annotation = annotationModal.annotation;
  const isOpen = annotationModal.isOpen;

  // Load linked entities and artifacts when annotation changes
  useEffect(() => {
    if (annotation?.id) {
      loadLinkedEntities();
      loadLinkedArtifacts();
    } else {
      setLinkedEntities([]);
      setLinkedArtifacts([]);
    }
  }, [annotation?.id]);

  // Set initial note text
  useEffect(() => {
    if (annotation) {
      setNoteText(annotation.content || '');
    } else {
      setNoteText('');
    }
  }, [annotation]);

  const loadLinkedEntities = async () => {
    if (!annotation?.id) return;
    try {
      const entities = await getLinkedEntities(annotation.id);
      setLinkedEntities(entities);
    } catch (err) {
      logger.error('Failed to load linked entities:', err);
    }
  };

  const loadLinkedArtifacts = async () => {
    if (!annotation?.id) return;
    try {
      const artifacts = await getLinkedArtifacts(annotation.id);
      setLinkedArtifacts(artifacts);
    } catch (err) {
      logger.error('Failed to load linked artifacts:', err);
    }
  };

  const handleSave = async () => {
    if (!currentSource?.id || !currentProject?.id) {
      showError('No active source or project');
      return;
    }

    setSaving(true);
    try {
      let savedAnnotation: Annotation;

      if (annotation?.id) {
        // Update existing annotation
        savedAnnotation = await updateAnnotation(annotation.id, {
          content: noteText,
        });
        showSuccess('Annotation updated');
      } else {
        // Create new annotation (from pending annotation data)
        if (!annotationModal.pendingAnnotation) {
          showError('No annotation data to save');
          return;
        }

        savedAnnotation = await createAnnotation({
          source_id: currentSource.id,
          project_id: currentProject.id,
          page_number: annotationModal.pendingAnnotation.pageNumber,
          annotation_type: annotationModal.pendingAnnotation.type,
          content: noteText,
          geometry: JSON.stringify(annotationModal.pendingAnnotation.geometry),
          metadata: annotationModal.pendingAnnotation.metadata
            ? JSON.stringify(annotationModal.pendingAnnotation.metadata)
            : null,
        });
        showSuccess('Annotation created');
      }

      // Reload annotations
      const { getAnnotations } = await import('../lib/tauri');
      const updatedAnnotations = await getAnnotations(currentSource.id);
      setAnnotations(updatedAnnotations);

      closeAnnotationModal();
    } catch (err) {
      logger.error('Failed to save annotation:', err);
      showError(`Failed to save: ${(err as Error).message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkEntity = (entityType: EntityType) => {
    setEntityTypeToLink(entityType);
    setShowEntityPicker(true);
  };

  const handleEntitySelected = async (entity: Entity) => {
    if (!annotation?.id) {
      showError('Please save the annotation first before linking entities');
      setShowEntityPicker(false);
      return;
    }

    try {
      await linkAnnotationToEntity(annotation.id, entity.id);
      await loadLinkedEntities();
      showSuccess(`Linked to ${entity.name}`);
    } catch (err) {
      logger.error('Failed to link entity:', err);
      showError(`Failed to link: ${(err as Error).message || 'Unknown error'}`);
    }

    setShowEntityPicker(false);
    setEntityTypeToLink(null);
  };

  const handleUnlinkEntity = async (entityId: string) => {
    if (!annotation?.id) return;

    try {
      await unlinkAnnotationFromEntity(annotation.id, entityId);
      await loadLinkedEntities();
      showSuccess('Entity unlinked');
    } catch (err) {
      logger.error('Failed to unlink entity:', err);
      showError(`Failed to unlink: ${(err as Error).message || 'Unknown error'}`);
    }
  };

  const handleLinkArtifact = () => {
    if (!annotation?.id) {
      showError('Please save the annotation first before linking artifacts');
      return;
    }
    setShowArtifactLinkModal(true);
  };

  const handleArtifactLinked = async (artifactId: string) => {
    if (!annotation?.id) return;

    try {
      await linkAnnotationToArtifact(annotation.id, artifactId);
      await loadLinkedArtifacts();
      showSuccess('Artifact linked');
    } catch (err) {
      logger.error('Failed to link artifact:', err);
      showError(`Failed to link: ${(err as Error).message || 'Unknown error'}`);
    }

    setShowArtifactLinkModal(false);
  };

  const handleUnlinkArtifact = async (artifactId: string) => {
    if (!annotation?.id) return;

    try {
      await unlinkAnnotationFromArtifact(annotation.id, artifactId);
      await loadLinkedArtifacts();
      showSuccess('Artifact unlinked');
    } catch (err) {
      logger.error('Failed to unlink artifact:', err);
      showError(`Failed to unlink: ${(err as Error).message || 'Unknown error'}`);
    }
  };

  const getEntityIcon = (entityType: string): string => {
    const icons: Record<string, string> = {
      person: '👤',
      event: '📅',
      theory: '💡',
      place: '📍',
      artifact: '🏺',
    };
    return icons[entityType] || '📌';
  };

  const getEntityColor = (entityType: string): string => {
    const colors: Record<string, string> = {
      person: '#4a90e2',
      event: '#e8b86d',
      theory: '#9b59b6',
      place: '#6ea36e',
      artifact: '#d4a373',
    };
    return colors[entityType] || '#888';
  };

  if (!isOpen) return null;

  const annotationType =
    annotation?.annotation_type || annotationModal.pendingAnnotation?.type || 'text';

  return (
    <>
      <Modal isOpen={isOpen} onClose={closeAnnotationModal} maxWidth="500px">
        <ModalHeader>
          {annotation ? 'Edit Annotation' : 'New Annotation'}
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
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNoteText(e.target.value)}
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
            {annotation?.id && (
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
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleLinkEntity('person')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                      }}
                      title="Link to Person"
                    >
                      👤
                    </button>
                    <button
                      onClick={() => handleLinkEntity('event')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                      }}
                      title="Link to Event"
                    >
                      📅
                    </button>
                    <button
                      onClick={() => handleLinkEntity('theory')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                      }}
                      title="Link to Theory"
                    >
                      💡
                    </button>
                    <button
                      onClick={() => handleLinkEntity('place')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        color: 'var(--text)',
                      }}
                      title="Link to Place"
                    >
                      📍
                    </button>
                  </div>
                </div>

                {linkedEntities.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {linkedEntities.map((entity) => (
                      <div
                        key={entity.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          background: getEntityColor(entity.entity_type),
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        <span>{getEntityIcon(entity.entity_type)}</span>
                        <span>{entity.name}</span>
                        <button
                          onClick={() => handleUnlinkEntity(entity.id)}
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
                    ))}
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

            {/* Linked Artifacts */}
            {annotation?.id && (
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
                    Linked Artifacts
                  </label>
                  <button
                    onClick={handleLinkArtifact}
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
                    + Link Artifact
                  </button>
                </div>

                {linkedArtifacts.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {linkedArtifacts.map((artifact) => (
                      <div
                        key={artifact.id}
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
                        <span>🏺</span>
                        <span>{artifact.name}</span>
                        <button
                          onClick={() => handleUnlinkArtifact(artifact.id)}
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
                    ))}
                  </div>
                ) : (
                  <div
                    style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}
                  >
                    No artifacts linked
                  </div>
                )}
              </div>
            )}

            {/* Info message if annotation not saved yet */}
            {!annotation?.id && (
              <div
                style={{
                  padding: '8px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                💡 Save the annotation first to link entities and artifacts
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button onClick={closeAnnotationModal} className="btn" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : annotation ? 'Update' : 'Save'}
            </button>
          </div>
        </ModalFooter>
      </Modal>

      {/* Entity Picker Modal */}
      {showEntityPicker && entityTypeToLink && (
        <EntityPicker
          entityType={entityTypeToLink}
          onSelect={handleEntitySelected}
          onClose={() => {
            setShowEntityPicker(false);
            setEntityTypeToLink(null);
          }}
        />
      )}

      {/* Artifact Link Modal */}
      {showArtifactLinkModal && annotation && (
        <ArtifactLinkModal
          annotation={annotation}
          onClose={() => setShowArtifactLinkModal(false)}
          onLink={handleArtifactLinked}
        />
      )}
    </>
  );
}
