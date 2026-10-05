import * as tauri from './tauri';

/**
 * Load all annotations for a source
 */
export async function loadAnnotations(sourceId: string) {
  return await tauri.loadAnnotations(sourceId);
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(annotationId: string): Promise<void> {
  return await tauri.deleteAnnotation(annotationId);
}

/**
 * Update an annotation's text
 */
export async function updateAnnotationText(annotationId: string, text: string) {
  return await tauri.updateAnnotation(annotationId, { text });
}

/**
 * Create a new annotation
 */
export async function createAnnotation(annotationData: any) {
  return await tauri.createAnnotation(annotationData);
}
