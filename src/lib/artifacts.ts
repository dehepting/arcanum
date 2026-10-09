import * as tauri from './tauri';
import { logger } from '../utils/logger';
import type { Artifact, CreateArtifactInput, UpdateArtifactInput } from '../types/entities';

/**
 * Upload an artifact image to local storage
 */
export async function uploadArtifactImage(file: File, projectId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Upload to local storage
  const result = await tauri.uploadFile('artifacts', fileName, data);

  // Return local file path (used as URL replacement)
  return result.storage_path;
}

/**
 * Create a new artifact
 */
export async function createArtifact(artifactData: CreateArtifactInput): Promise<Artifact> {
  return await tauri.createArtifact(artifactData);
}

/**
 * Load all artifacts for a project
 */
export async function loadArtifacts(projectId: string): Promise<Artifact[]> {
  return await tauri.loadArtifacts(projectId);
}

/**
 * Get a single artifact by ID
 */
export async function getArtifact(artifactId: string): Promise<Artifact> {
  return await tauri.getArtifact(artifactId);
}

/**
 * Update an artifact
 */
export async function updateArtifact(
  artifactId: string,
  updates: UpdateArtifactInput
): Promise<Artifact> {
  return await tauri.updateArtifact(artifactId, updates);
}

/**
 * Delete an artifact and its images
 */
export async function deleteArtifact(
  artifactId: string,
  imageUrls?: string[] | null
): Promise<void> {
  // Delete from database
  await tauri.deleteArtifact(artifactId);

  // Delete images from storage
  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      try {
        // Extract file path from URL (if it's a path)
        const filePath = url;
        await tauri.deleteFile('artifacts', filePath);
      } catch (error) {
        logger.error('Error deleting artifact image:', error);
      }
    }
  }
}

/**
 * Get artifacts by findspot (place)
 */
export async function getArtifactsByFindspot(placeId: string): Promise<Artifact[]> {
  return await tauri.getArtifactsByFindspot(placeId);
}

/**
 * Search artifacts
 */
export async function searchArtifacts(
  projectId: string,
  query: string,
  filters: Record<string, any> = {}
): Promise<Artifact[]> {
  return await tauri.searchArtifacts(projectId, query, filters);
}
