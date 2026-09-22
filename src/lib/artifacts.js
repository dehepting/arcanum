import * as tauri from './tauri';

/**
 * Upload an artifact image to local storage
 */
export async function uploadArtifactImage(file, projectId) {
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
export async function createArtifact(artifactData) {
  return await tauri.createArtifact({
    ...artifactData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

/**
 * Load all artifacts for a project
 */
export async function loadArtifacts(projectId) {
  return await tauri.loadArtifacts(projectId);
}

/**
 * Get a single artifact by ID
 */
export async function getArtifact(artifactId) {
  return await tauri.getArtifact(artifactId);
}

/**
 * Update an artifact
 */
export async function updateArtifact(artifactId, updates) {
  return await tauri.updateArtifact(artifactId, updates);
}

/**
 * Delete an artifact and its images
 */
export async function deleteArtifact(artifactId, imageUrls) {
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
        console.error('Error deleting artifact image:', error);
      }
    }
  }
}

/**
 * Get artifacts by findspot (place)
 */
export async function getArtifactsByFindspot(placeId) {
  return await tauri.getArtifactsByFindspot(placeId);
}

/**
 * Search artifacts
 */
export async function searchArtifacts(projectId, query, filters = {}) {
  return await tauri.searchArtifacts(projectId, query, filters);
}
