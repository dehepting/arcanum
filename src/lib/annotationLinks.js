import {
  linkAnnotationToEntity as tauriLinkAnnotationToEntity,
  unlinkAnnotationFromEntity as tauriUnlinkAnnotationFromEntity,
  getEntitiesForAnnotation as tauriGetEntitiesForAnnotation,
  getAnnotationsForEntity as tauriGetAnnotationsForEntity,
} from './tauri';

/**
 * Link an annotation to an entity (Person, Event, Theory, Place, or Artifact)
 * @param {number} annotationId - The annotation ID
 * @param {number} entityId - The entity ID
 * @param {string} entityType - The entity type: 'person', 'event', 'theory', 'place', 'artifact'
 * @param {string} relationshipType - The relationship type (default: 'mentions')
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function linkAnnotationToEntity(
  annotationId,
  entityId,
  entityType,
  relationshipType = 'mentions'
) {
  try {
    const data = await tauriLinkAnnotationToEntity(
      annotationId,
      entityId,
      entityType,
      relationshipType
    );
    return { success: true, data };
  } catch (error) {
    console.error('Failed to link annotation to entity:', error);
    return { success: false, error: error.message || 'Failed to link annotation to entity' };
  }
}

/**
 * Unlink an annotation from an entity
 * @param {number} annotationId - The annotation ID
 * @param {number} entityId - The entity ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unlinkAnnotationFromEntity(annotationId, entityId) {
  try {
    await tauriUnlinkAnnotationFromEntity(annotationId, entityId);
    return { success: true };
  } catch (error) {
    console.error('Failed to unlink annotation from entity:', error);
    return { success: false, error: error.message || 'Failed to unlink annotation from entity' };
  }
}

/**
 * Get all entities linked to an annotation
 * @param {number} annotationId - The annotation ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getEntitiesForAnnotation(annotationId) {
  try {
    const data = await tauriGetEntitiesForAnnotation(annotationId);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to get entities for annotation:', error);
    return { success: false, data: [], error: error.message || 'Failed to get entities' };
  }
}

/**
 * Get all annotations linked to an entity
 * @param {number} entityId - The entity ID
 * @param {string} entityType - The entity type: 'person', 'event', 'theory', 'place', 'artifact'
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getAnnotationsForEntity(entityId, entityType) {
  try {
    const data = await tauriGetAnnotationsForEntity(entityId, entityType);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to get annotations for entity:', error);
    return { success: false, data: [], error: error.message || 'Failed to get annotations' };
  }
}
