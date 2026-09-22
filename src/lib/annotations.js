import * as tauri from './tauri';

/**
 * Load all annotations for a source
 * @param {string} sourceId - The source ID
 * @returns {Promise<Array>} Array of annotation records
 */
export async function loadAnnotations(sourceId) {
  return await tauri.loadAnnotations(sourceId);
}

/**
 * Delete an annotation
 * @param {string} annotationId - The annotation ID to delete
 */
export async function deleteAnnotation(annotationId) {
  return await tauri.deleteAnnotation(annotationId);
}

/**
 * Update an annotation's text
 * @param {string} annotationId - The annotation ID
 * @param {string} text - New text content
 */
export async function updateAnnotationText(annotationId, text) {
  return await tauri.updateAnnotation(annotationId, { content: text });
}

/**
 * Create a new annotation
 * @param {object} annotationData - Annotation data
 */
export async function createAnnotation(annotationData) {
  return await tauri.createAnnotation(annotationData);
}
