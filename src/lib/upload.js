import * as tauri from './tauri';

/**
 * Upload a PDF file to local storage and create a source record
 * @param {File} file - The PDF file to upload
 * @param {string} projectId - The project ID to associate with this source
 * @returns {Promise<Object>} The created source record
 */
export async function uploadPDF(file, projectId) {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.type !== 'application/pdf') {
    throw new Error('File must be a PDF');
  }

  // Create a unique file path: project_id/timestamp_filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${projectId}/${timestamp}_${sanitizedName}`;

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Upload to local storage
  const uploadResult = await tauri.uploadFile('sources', filePath, data);

  // Create source record in database
  const source = await tauri.createSource({
    project_id: projectId,
    title: file.name,
    file_name: sanitizedName,
    storage_path: uploadResult.storage_path,
    file_size: file.size,
    mime_type: 'application/pdf',
  });

  return source;
}

/**
 * Load all sources for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of source records
 */
export async function loadSources(projectId) {
  return await tauri.loadSources(projectId);
}

/**
 * Delete a source and its file
 * @param {string} sourceId - The source ID to delete
 * @param {string} storagePath - The storage path to delete
 */
export async function deleteSource(sourceId, storagePath) {
  // Delete from storage
  if (storagePath) {
    try {
      await tauri.deleteFile('sources', storagePath);
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }
  }

  // Delete from database
  await tauri.deleteSource(sourceId);
}
