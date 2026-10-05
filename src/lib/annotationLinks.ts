import {
  linkAnnotationToEntity as tauriLinkAnnotationToEntity,
  unlinkAnnotationFromEntity as tauriUnlinkAnnotationFromEntity,
  getEntitiesForAnnotation as tauriGetEntitiesForAnnotation,
  getAnnotationsForEntity as tauriGetAnnotationsForEntity,
} from './tauri';
import type { EntityType, AnnotationEntityLink } from '../types/entities';
import type { Annotation } from '../types/annotations';

/**
 * Result type for operations that may fail
 */
type OperationResult<T> = {
  success: boolean;
  data: T;
  error?: string;
};

/**
 * Link an annotation to an entity (Person, Event, Theory, Place, or Artifact)
 */
export async function linkAnnotationToEntity(
  annotationId: string,
  entityId: string,
  entityType: EntityType,
  relationshipType: string = 'mentions'
): Promise<OperationResult<AnnotationEntityLink>> {
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
    return {
      success: false,
      error: (error as Error).message || 'Failed to link annotation to entity',
    };
  }
}

/**
 * Unlink an annotation from an entity
 */
export async function unlinkAnnotationFromEntity(
  annotationId: string,
  entityId: string
): Promise<OperationResult<void>> {
  try {
    await tauriUnlinkAnnotationFromEntity(annotationId, entityId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to unlink annotation from entity:', error);
    return {
      success: false,
      error: (error as Error).message || 'Failed to unlink annotation from entity',
    };
  }
}

/**
 * Get all entities linked to an annotation
 */
export async function getEntitiesForAnnotation(
  annotationId: string
): Promise<OperationResult<AnnotationEntityLink[]>> {
  try {
    const data = await tauriGetEntitiesForAnnotation(annotationId);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to get entities for annotation:', error);
    return {
      success: false,
      data: [],
      error: (error as Error).message || 'Failed to get entities',
    };
  }
}

/**
 * Get all annotations linked to an entity
 */
export async function getAnnotationsForEntity(
  entityId: string,
  entityType: EntityType
): Promise<OperationResult<Annotation[]>> {
  try {
    const data = await tauriGetAnnotationsForEntity(entityId, entityType);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Failed to get annotations for entity:', error);
    return {
      success: false,
      data: [],
      error: (error as Error).message || 'Failed to get annotations',
    };
  }
}
