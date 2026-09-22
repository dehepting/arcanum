import * as tauri from './tauri';

/**
 * Create a new theory and optionally link to annotation
 */
export async function createTheory(theoryData, annotationId = null) {
  return await tauri.createTheory(theoryData, annotationId);
}

/**
 * Update a theory's properties
 */
export async function updateTheory(theoryId, updates) {
  return await tauri.updateTheory(theoryId, updates);
}

/**
 * Load all theories for a project
 */
export async function loadTheories(projectId) {
  return await tauri.loadTheories(projectId);
}

/**
 * Delete a theory
 */
export async function deleteTheory(theoryId) {
  return await tauri.deleteTheory(theoryId);
}

/**
 * Link a theory to an annotation
 */
export async function linkTheoryToAnnotation(annotationId, theoryId) {
  return await tauri.linkTheoryToAnnotation(annotationId, theoryId);
}

/**
 * Unlink a theory from an annotation
 */
export async function unlinkTheoryFromAnnotation(annotationId, theoryId) {
  return await tauri.invoke('unlink_annotation_from_theory', {
    annotationId,
    theoryId,
  });
}
