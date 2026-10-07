import { invoke } from '@tauri-apps/api/core';
import {
  createPerson,
  updatePerson,
  loadPeople,
  deletePerson,
  linkPersonToAnnotation,
  createEvent,
  updateEvent,
  loadEvents,
  deleteEvent,
  createTheory,
  updateTheory,
  loadTheories,
  deleteTheory,
  linkTheoryToAnnotation,
  createPlace,
  updatePlace,
  loadPlaces,
  deletePlace,
  createArtifact,
  updateArtifact,
  loadArtifacts,
  deleteArtifact,
} from './entityCrud';
import { validateOrThrow, validateArrayOrThrow, validateOptional } from '../schemas';
import {
  ProjectSchema,
  SourceSchema,
  AnnotationSchema,
  EntityPageSchema,
  ArtifactSchema,
  PlaceSchema,
  MapOverlaySchema,
} from '../schemas';

import type { Project, Source, MapOverlay } from '../types/store';
import type {
  Person,
  Event,
  Theory,
  Place,
  Artifact,
  EntityType,
  EntityPage,
  AnnotationEntityLink,
} from '../types/entities';
import type { Annotation } from '../types/annotations';

/**
 * Tauri API Client
 * Replaces Supabase with local Tauri commands
 */

// Re-export entity CRUD operations for backward compatibility
export {
  createPerson,
  updatePerson,
  loadPeople,
  deletePerson,
  linkPersonToAnnotation,
  createEvent,
  updateEvent,
  loadEvents,
  deleteEvent,
  createTheory,
  updateTheory,
  loadTheories,
  deleteTheory,
  linkTheoryToAnnotation,
  createPlace,
  updatePlace,
  loadPlaces,
  deletePlace,
  createArtifact,
  updateArtifact,
  loadArtifacts,
  deleteArtifact,
};

// Projects
export async function createProject(projectData: Partial<Project>): Promise<Project> {
  const response = await invoke('create_project', { input: projectData });
  return validateOrThrow(ProjectSchema, response, 'create_project');
}

export async function getProject(projectId: string): Promise<Project> {
  const response = await invoke('get_project', { projectId });
  return validateOrThrow(ProjectSchema, response, 'get_project');
}

export async function listProjects(): Promise<Project[]> {
  const response = await invoke('list_projects');
  return validateArrayOrThrow(ProjectSchema, response, 'list_projects');
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<Project> {
  const response = await invoke('update_project', { projectId, input: updates });
  return validateOrThrow(ProjectSchema, response, 'update_project');
}

export async function deleteProject(projectId: string): Promise<void> {
  return await invoke('delete_project', { projectId });
}

// Artifacts (CRUD imported from entityCrud.ts)
export async function getArtifact(artifactId: string): Promise<Artifact> {
  const response = await invoke('get_artifact', { artifactId });
  return validateOrThrow(ArtifactSchema, response, 'get_artifact');
}

export async function getArtifactsByFindspot(placeId: string): Promise<Artifact[]> {
  const response = await invoke('get_artifacts_by_findspot', { placeId });
  return validateArrayOrThrow(ArtifactSchema, response, 'get_artifacts_by_findspot');
}

interface SearchArtifactsFilters {
  category?: string;
  ownerType?: string;
}

export async function searchArtifacts(
  projectId: string,
  query: string,
  filters: SearchArtifactsFilters = {}
): Promise<Artifact[]> {
  const response = await invoke('search_artifacts', {
    input: {
      projectId,
      query,
      category: filters.category,
      ownerType: filters.ownerType,
    },
  });
  return validateArrayOrThrow(ArtifactSchema, response, 'search_artifacts');
}

// Places (CRUD imported from entityCrud.ts)
export async function getPlaceForAnnotation(annotationId: string): Promise<Place | null> {
  const response = await invoke('get_place_for_annotation', { annotationId });
  const result = validateOptional(PlaceSchema, response, 'get_place_for_annotation');
  if (result.success === false) {
    throw new Error(result.error);
  }
  return result.data;
}

export async function unlinkAnnotationFromPlace(
  annotationId: string,
  placeId: string
): Promise<void> {
  return await invoke('unlink_annotation_from_place', { annotationId, placeId });
}

// People (CRUD imported from entityCrud.ts)

// Events (CRUD imported from entityCrud.ts)

// Theories (CRUD imported from entityCrud.ts)

// Sources
export async function createSource(sourceData: Partial<Source>): Promise<Source> {
  const response = await invoke('create_source', { input: sourceData });
  return validateOrThrow(SourceSchema, response, 'create_source');
}

export async function getSource(sourceId: string): Promise<Source> {
  const response = await invoke('get_source', { sourceId });
  return validateOrThrow(SourceSchema, response, 'get_source');
}

export async function loadSources(projectId: string): Promise<Source[]> {
  const response = await invoke('list_sources', { projectId });
  return validateArrayOrThrow(SourceSchema, response, 'list_sources');
}

export async function updateSource(sourceId: string, updates: Partial<Source>): Promise<Source> {
  const response = await invoke('update_source', { sourceId, input: updates });
  return validateOrThrow(SourceSchema, response, 'update_source');
}

export async function deleteSource(sourceId: string): Promise<void> {
  return await invoke('delete_source', { sourceId });
}

// Entity Pages
export async function createEntityPage(pageData: Partial<EntityPage>): Promise<EntityPage> {
  const response = await invoke('create_entity_page', { input: pageData });
  return validateOrThrow(EntityPageSchema, response, 'create_entity_page');
}

export async function getEntityPage(entityId: string): Promise<EntityPage | null> {
  const response = await invoke('get_entity_page', { entityId });
  const result = validateOptional(EntityPageSchema, response, 'get_entity_page');
  if (result.success === false) {
    throw new Error(result.error);
  }
  return result.data;
}

export async function loadEntityPages(projectId: string): Promise<EntityPage[]> {
  const response = await invoke('list_entity_pages', { projectId });
  return validateArrayOrThrow(EntityPageSchema, response, 'list_entity_pages');
}

export async function updateEntityPage(
  entityId: string,
  updates: Partial<EntityPage>
): Promise<EntityPage> {
  const response = await invoke('update_entity_page', { entityId, input: updates });
  return validateOrThrow(EntityPageSchema, response, 'update_entity_page');
}

export async function deleteEntityPage(entityId: string): Promise<void> {
  return await invoke('delete_entity_page', { entityId });
}

// File operations
interface FileOperationResult {
  storage_path: string;
  [key: string]: any;
}

interface FileReadResult {
  data: number[];
  [key: string]: any;
}

export async function uploadFile(
  bucket: string,
  filePath: string,
  data: Uint8Array
): Promise<FileOperationResult> {
  return await invoke('upload_file', {
    input: {
      bucket,
      file_path: filePath,
      data: Array.from(data), // Convert to array for serialization
    },
  });
}

export async function readFile(bucket: string, filePath: string): Promise<FileReadResult> {
  return await invoke('read_file', {
    input: {
      bucket,
      file_path: filePath,
    },
  });
}

export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  return await invoke('delete_file', {
    input: {
      bucket,
      file_path: filePath,
    },
  });
}

export async function getFilePath(bucket: string, filePath: string): Promise<string> {
  return await invoke('get_file_path', {
    input: {
      bucket,
      file_path: filePath,
    },
  });
}

export async function copyFileToStorage(
  sourcePath: string,
  bucket: string,
  destPath: string
): Promise<void> {
  return await invoke('copy_file_to_storage', {
    sourcePath,
    bucket,
    destPath,
  });
}

// Migration
export async function importAllData(dataDir: string): Promise<void> {
  return await invoke('import_all_data', { dataDir });
}

export async function importFiles(filesDir: string): Promise<void> {
  return await invoke('import_files', { filesDir });
}

// Annotations
interface AnnotationInput {
  source_id: string;
  project_id?: string;
  page_number?: number;
  annotation_type: string;
  text?: string;
  rect?: { x: number; y: number; w: number; h: number };
  ink_data?: any;
}

interface AnnotationWithDisplayProps extends Annotation {
  text?: string;
  rect_x: number;
  rect_y: number;
  rect_w: number;
  rect_h: number;
  type: string;
  ink_data?: any;
}

export async function createAnnotation(
  annotationData: AnnotationInput
): Promise<AnnotationWithDisplayProps> {
  // Transform frontend format to backend format
  // Frontend sends: { source_id, project_id, page_number, annotation_type, rect, text }
  // Backend expects: { source_id, project_id, page_number, annotation_type, content, geometry, metadata }

  let projectId = annotationData.project_id;

  // If project_id not provided, try to look it up from the source
  if (!projectId) {
    try {
      const sources = await invoke<Source[]>('list_sources', { projectId: null });
      const source = sources.find((s) => s.id === annotationData.source_id);
      projectId = source?.project_id;
    } catch (e) {
      console.warn('Failed to look up project_id:', e);
    }
  }

  if (!projectId) {
    throw new Error('Could not determine project_id for annotation');
  }

  const input = {
    source_id: annotationData.source_id,
    project_id: projectId,
    page_number: annotationData.page_number,
    annotation_type: annotationData.annotation_type,
    content: annotationData.text || null,
    geometry: annotationData.rect ? JSON.stringify(annotationData.rect) : null,
    metadata: annotationData.ink_data
      ? JSON.stringify({ ink_data: annotationData.ink_data })
      : null,
  };

  const response = await invoke('create_annotation', { input });
  const result = validateOrThrow(AnnotationSchema, response, 'create_annotation');

  // Transform backend response to frontend format
  return {
    ...result,
    text: result.content,
    rect_x: annotationData.rect?.x ?? 0,
    rect_y: annotationData.rect?.y ?? 0,
    rect_w: annotationData.rect?.w ?? 0.1,
    rect_h: annotationData.rect?.h ?? 0.05,
    type: result.annotation_type,
    ink_data: annotationData.ink_data,
  };
}

export async function loadAnnotations(sourceId: string): Promise<AnnotationWithDisplayProps[]> {
  const response = await invoke('load_annotations', { sourceId });
  const annotations = validateArrayOrThrow(AnnotationSchema, response, 'load_annotations');

  // Transform backend format to frontend format
  return annotations.map((ann) => {
    let rect: { x: number; y: number; w: number; h: number } | null = null;
    let inkData: any = null;

    if (ann.geometry) {
      try {
        rect = JSON.parse(ann.geometry);
      } catch (e) {
        console.warn('Failed to parse annotation geometry:', e);
      }
    }

    if (ann.metadata) {
      try {
        const metadata = JSON.parse(ann.metadata);
        inkData = metadata.ink_data;
      } catch (e) {
        console.warn('Failed to parse annotation metadata:', e);
      }
    }

    return {
      ...ann,
      text: ann.content,
      rect_x: rect?.x ?? 0,
      rect_y: rect?.y ?? 0,
      rect_w: rect?.w ?? 0.1,
      rect_h: rect?.h ?? 0.05,
      type: ann.annotation_type,
      ink_data: inkData,
    };
  });
}

interface AnnotationUpdateInput {
  text?: string;
  rect_x?: number;
  rect_y?: number;
  rect_w?: number;
  rect_h?: number;
}

export async function updateAnnotation(
  annotationId: string,
  updates: AnnotationUpdateInput
): Promise<AnnotationWithDisplayProps> {
  // Transform frontend format to backend format
  const input: any = {};

  if (updates.text !== undefined) {
    input.content = updates.text;
  }
  if (updates.rect_x !== undefined || updates.rect_y !== undefined) {
    // If position is being updated, we need to get current geometry and update it
    input.geometry = JSON.stringify({
      x: updates.rect_x,
      y: updates.rect_y,
      w: updates.rect_w,
      h: updates.rect_h,
    });
  }

  const response = await invoke('update_annotation', { annotationId, input });
  const result = validateOrThrow(AnnotationSchema, response, 'update_annotation');

  // Transform backend response to frontend format
  let rect: { x: number; y: number; w: number; h: number } | null = null;
  if (result.geometry) {
    try {
      rect = JSON.parse(result.geometry);
    } catch (e) {
      console.warn('Failed to parse annotation geometry:', e);
    }
  }

  return {
    ...result,
    text: result.content,
    rect_x: rect?.x ?? 0,
    rect_y: rect?.y ?? 0,
    rect_w: rect?.w ?? 0.1,
    rect_h: rect?.h ?? 0.05,
    type: result.annotation_type,
  };
}

export async function deleteAnnotation(annotationId: string): Promise<void> {
  return await invoke('delete_annotation', { annotationId });
}

// Map Overlays
export async function createOverlay(overlayData: Partial<MapOverlay>): Promise<MapOverlay> {
  const response = await invoke('create_overlay', { input: overlayData });
  return validateOrThrow(MapOverlaySchema, response, 'create_overlay') as MapOverlay;
}

export async function loadOverlays(projectId: string): Promise<MapOverlay[]> {
  const response = await invoke('load_overlays', { projectId });
  return validateArrayOrThrow(MapOverlaySchema, response, 'load_overlays') as MapOverlay[];
}

export async function updateOverlay(
  overlayId: string,
  updates: Partial<MapOverlay>
): Promise<MapOverlay> {
  const response = await invoke('update_overlay', { overlayId, input: updates });
  return validateOrThrow(MapOverlaySchema, response, 'update_overlay') as MapOverlay;
}

export async function deleteOverlay(overlayId: string): Promise<void> {
  return await invoke('delete_overlay', { overlayId });
}

// Provenance
interface ProvenanceRecord {
  id: string;
  entity_id: string;
  entity_type: EntityType;
  event_type: string;
  event_date?: string;
  location?: string;
  description?: string;
  source_citation?: string;
  created_at: string;
  updated_at: string;
}

export async function createProvenanceRecord(
  provenanceData: Partial<ProvenanceRecord>
): Promise<ProvenanceRecord> {
  return await invoke('create_provenance_record', { input: provenanceData });
}

export async function getProvenance(
  entityId: string,
  entityType: EntityType
): Promise<ProvenanceRecord[]> {
  return await invoke('get_provenance', { entityId, entityType });
}

export async function updateProvenanceRecord(
  recordId: string,
  updates: Partial<ProvenanceRecord>
): Promise<ProvenanceRecord> {
  return await invoke('update_provenance_record', { recordId, input: updates });
}

export async function deleteProvenanceRecord(recordId: string): Promise<void> {
  return await invoke('delete_provenance_record', { recordId });
}

// Annotation Entity Links
export async function linkAnnotationToEntity(
  annotationId: string,
  entityId: string,
  entityType: EntityType,
  relationshipType: string = 'mentions'
): Promise<AnnotationEntityLink> {
  return await invoke('link_annotation_to_entity', {
    annotationId,
    entityId,
    entityType,
    relationshipType,
  });
}

export async function unlinkAnnotationFromEntity(
  annotationId: string,
  entityId: string
): Promise<void> {
  return await invoke('unlink_annotation_from_entity', { annotationId, entityId });
}

export async function getEntitiesForAnnotation(
  annotationId: string
): Promise<AnnotationEntityLink[]> {
  return await invoke('get_entities_for_annotation', { annotationId });
}

export async function getAnnotationsForEntity(
  entityId: string,
  entityType: EntityType
): Promise<Annotation[]> {
  return await invoke('get_annotations_for_entity', { entityId, entityType });
}
