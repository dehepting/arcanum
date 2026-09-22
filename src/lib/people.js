import * as tauri from './tauri';

/**
 * Create a new person and optionally link to annotation
 */
export async function createPerson(personData, annotationId = null, relationshipType = 'mentions') {
  return await tauri.createPerson(personData, annotationId, relationshipType);
}

/**
 * Update a person's properties
 */
export async function updatePerson(personId, updates) {
  return await tauri.updatePerson(personId, updates);
}

/**
 * Load all people for a project
 */
export async function loadPeople(projectId) {
  return await tauri.loadPeople(projectId);
}

/**
 * Delete a person
 */
export async function deletePerson(personId) {
  return await tauri.deletePerson(personId);
}

/**
 * Link a person to an annotation
 */
export async function linkPersonToAnnotation(
  annotationId,
  personId,
  relationshipType = 'mentions'
) {
  return await tauri.linkPersonToAnnotation(annotationId, personId, relationshipType);
}

/**
 * Unlink a person from an annotation
 */
export async function unlinkPersonFromAnnotation(annotationId, personId) {
  return await tauri.invoke('unlink_annotation_from_person', {
    annotationId,
    personId,
  });
}
