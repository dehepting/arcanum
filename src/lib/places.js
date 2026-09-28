import * as tauri from './tauri';

/**
 * Create a new place (map pin) and optionally link to annotation
 */
export async function createPlace(placeData, annotationId = null) {
  return await tauri.createPlace(placeData, annotationId);
}

/**
 * Update a place's properties
 */
export async function updatePlace(placeId, updates) {
  return await tauri.updatePlace(placeId, updates);
}

/**
 * Load all places for a project
 */
export async function loadPlaces(projectId) {
  return await tauri.loadPlaces(projectId);
}

/**
 * Get place linked to an annotation
 */
export async function getPlaceForAnnotation(annotationId) {
  return await tauri.getPlaceForAnnotation(annotationId);
}

/**
 * Delete a place and its links
 */
export async function deletePlace(placeId) {
  return await tauri.deletePlace(placeId);
}

/**
 * Unlink annotation from place
 */
export async function unlinkAnnotationFromPlace(annotationId, placeId) {
  return await tauri.unlinkAnnotationFromPlace(annotationId, placeId);
}

/**
 * Get annotations linked to a place
 * Note: This requires implementing annotation commands in backend
 */
export async function getAnnotationsForPlace(placeId) {
  // TODO: Implement annotation queries in Phase 2 backend
  // For now, return empty array
  return [];
}
