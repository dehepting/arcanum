import { invoke } from '@tauri-apps/api/core';

/**
 * Tauri API Client
 * Replaces Supabase with local Tauri commands
 */

// Projects
export async function createProject(projectData) {
  return await invoke('create_project', { input: projectData });
}

export async function getProject(projectId) {
  return await invoke('get_project', { projectId });
}

export async function listProjects() {
  return await invoke('list_projects');
}

export async function updateProject(projectId, updates) {
  return await invoke('update_project', { projectId, input: updates });
}

export async function deleteProject(projectId) {
  return await invoke('delete_project', { projectId });
}

// Artifacts
export async function createArtifact(artifactData) {
  return await invoke('create_artifact', { input: artifactData });
}

export async function getArtifact(artifactId) {
  return await invoke('get_artifact', { artifactId });
}

export async function loadArtifacts(projectId) {
  return await invoke('list_artifacts', { projectId });
}

export async function updateArtifact(artifactId, updates) {
  return await invoke('update_artifact', { artifactId, input: updates });
}

export async function deleteArtifact(artifactId) {
  return await invoke('delete_artifact', { artifactId });
}

export async function getArtifactsByFindspot(placeId) {
  return await invoke('get_artifacts_by_findspot', { placeId });
}

export async function searchArtifacts(projectId, query, filters = {}) {
  return await invoke('search_artifacts', {
    input: {
      projectId,
      query,
      category: filters.category,
      ownerType: filters.ownerType,
    },
  });
}

// Places
export async function createPlace(placeData, annotationId = null) {
  return await invoke('create_place', {
    input: {
      ...placeData,
      annotation_id: annotationId,
    },
  });
}

export async function updatePlace(placeId, updates) {
  return await invoke('update_place', { placeId, input: updates });
}

export async function loadPlaces(projectId) {
  return await invoke('list_places', { projectId });
}

export async function getPlaceForAnnotation(annotationId) {
  return await invoke('get_place_for_annotation', { annotationId });
}

export async function deletePlace(placeId) {
  return await invoke('delete_place', { placeId });
}

export async function unlinkAnnotationFromPlace(annotationId, placeId) {
  return await invoke('unlink_annotation_from_place', { annotationId, placeId });
}

// People
export async function createPerson(personData, annotationId = null, relationshipType = 'mentions') {
  return await invoke('create_person', {
    input: {
      ...personData,
      annotation_id: annotationId,
      relationship_type: relationshipType,
    },
  });
}

export async function updatePerson(personId, updates) {
  return await invoke('update_person', { personId, input: updates });
}

export async function loadPeople(projectId) {
  return await invoke('list_people', { projectId });
}

export async function deletePerson(personId) {
  return await invoke('delete_person', { personId });
}

export async function linkPersonToAnnotation(
  annotationId,
  personId,
  relationshipType = 'mentions'
) {
  return await invoke('link_annotation_to_person', {
    annotationId,
    personId,
    relationshipType,
  });
}

// Events
export async function createEvent(eventData) {
  return await invoke('create_event', { input: eventData });
}

export async function updateEvent(eventId, updates) {
  return await invoke('update_event', { eventId, input: updates });
}

export async function loadEvents(projectId) {
  return await invoke('list_events', { projectId });
}

export async function deleteEvent(eventId) {
  return await invoke('delete_event', { eventId });
}

// Theories
export async function createTheory(theoryData, annotationId = null) {
  return await invoke('create_theory', {
    input: {
      ...theoryData,
      annotation_id: annotationId,
    },
  });
}

export async function updateTheory(theoryId, updates) {
  return await invoke('update_theory', { theoryId, input: updates });
}

export async function loadTheories(projectId) {
  return await invoke('list_theories', { projectId });
}

export async function deleteTheory(theoryId) {
  return await invoke('delete_theory', { theoryId });
}

export async function linkTheoryToAnnotation(annotationId, theoryId) {
  return await invoke('link_annotation_to_theory', { annotationId, theoryId });
}

// Sources
export async function createSource(sourceData) {
  return await invoke('create_source', { input: sourceData });
}

export async function getSource(sourceId) {
  return await invoke('get_source', { sourceId });
}

export async function loadSources(projectId) {
  return await invoke('list_sources', { projectId });
}

export async function updateSource(sourceId, updates) {
  return await invoke('update_source', { sourceId, input: updates });
}

export async function deleteSource(sourceId) {
  return await invoke('delete_source', { sourceId });
}

// Entity Pages
export async function createEntityPage(pageData) {
  return await invoke('create_entity_page', { input: pageData });
}

export async function getEntityPage(entityId) {
  return await invoke('get_entity_page', { entityId });
}

export async function loadEntityPages(projectId) {
  return await invoke('list_entity_pages', { projectId });
}

export async function updateEntityPage(entityId, updates) {
  return await invoke('update_entity_page', { entityId, input: updates });
}

export async function deleteEntityPage(entityId) {
  return await invoke('delete_entity_page', { entityId });
}

// File operations
export async function uploadFile(bucket, filePath, data) {
  return await invoke('upload_file', {
    input: {
      bucket,
      file_path: filePath,
      data: Array.from(data), // Convert to array for serialization
    },
  });
}

export async function readFile(bucket, filePath) {
  return await invoke('read_file', {
    input: {
      bucket,
      file_path: filePath,
    },
  });
}

export async function deleteFile(bucket, filePath) {
  return await invoke('delete_file', {
    input: {
      bucket,
      file_path: filePath,
    },
  });
}

export async function getFilePath(bucket, filePath) {
  return await invoke('get_file_path', {
    input: {
      bucket,
      file_path: filePath,
    },
  });
}

export async function copyFileToStorage(sourcePath, bucket, destPath) {
  return await invoke('copy_file_to_storage', {
    sourcePath,
    bucket,
    destPath,
  });
}

// Migration
export async function importAllData(dataDir) {
  return await invoke('import_all_data', { dataDir });
}

export async function importFiles(filesDir) {
  return await invoke('import_files', { filesDir });
}

// Annotations
export async function createAnnotation(annotationData) {
  return await invoke('create_annotation', { input: annotationData });
}

export async function loadAnnotations(sourceId) {
  return await invoke('load_annotations', { sourceId });
}

export async function updateAnnotation(annotationId, updates) {
  return await invoke('update_annotation', { annotationId, input: updates });
}

export async function deleteAnnotation(annotationId) {
  return await invoke('delete_annotation', { annotationId });
}

// Map Overlays
export async function createOverlay(overlayData) {
  return await invoke('create_overlay', { input: overlayData });
}

export async function loadOverlays(projectId) {
  return await invoke('load_overlays', { projectId });
}

export async function updateOverlay(overlayId, updates) {
  return await invoke('update_overlay', { overlayId, input: updates });
}

export async function deleteOverlay(overlayId) {
  return await invoke('delete_overlay', { overlayId });
}

// Provenance
export async function createProvenanceRecord(provenanceData) {
  return await invoke('create_provenance_record', { input: provenanceData });
}

export async function getProvenance(entityId, entityType) {
  return await invoke('get_provenance', { entityId, entityType });
}

export async function updateProvenanceRecord(recordId, updates) {
  return await invoke('update_provenance_record', { recordId, input: updates });
}

export async function deleteProvenanceRecord(recordId) {
  return await invoke('delete_provenance_record', { recordId });
}
