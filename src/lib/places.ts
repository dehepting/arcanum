import * as tauri from './tauri';
import type { Place, CreatePlaceInput, UpdatePlaceInput } from '../types/entities';
import type { Annotation } from '../types/annotations';

/**
 * Create a new place (map pin) and optionally link to annotation
 */
export async function createPlace(
  placeData: CreatePlaceInput,
  annotationId: string | null = null
): Promise<Place> {
  return await tauri.createPlace(placeData, annotationId);
}

/**
 * Update a place's properties
 */
export async function updatePlace(placeId: string, updates: UpdatePlaceInput): Promise<Place> {
  return await tauri.updatePlace(placeId, updates);
}

/**
 * Load all places for a project
 */
export async function loadPlaces(projectId: string): Promise<Place[]> {
  return await tauri.loadPlaces(projectId);
}

/**
 * Get place linked to an annotation
 */
export async function getPlaceForAnnotation(annotationId: string): Promise<Place | null> {
  return await tauri.getPlaceForAnnotation(annotationId);
}

/**
 * Delete a place and its links
 */
export async function deletePlace(placeId: string): Promise<void> {
  return await tauri.deletePlace(placeId);
}

/**
 * Unlink annotation from place
 */
export async function unlinkAnnotationFromPlace(
  annotationId: string,
  placeId: string
): Promise<void> {
  return await tauri.unlinkAnnotationFromPlace(annotationId, placeId);
}

/**
 * Get annotations linked to a place
 * Note: This requires implementing annotation commands in backend
 */
export async function getAnnotationsForPlace(_placeId: string): Promise<Annotation[]> {
  // TODO: Implement annotation queries in Phase 2 backend
  // For now, return empty array
  return [];
}
