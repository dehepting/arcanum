import * as tauri from './tauri';
import { logger } from '../utils/logger';
import type { Source } from '../types/store';

/**
 * Upload a PDF file to local storage and create a source record
 */
export async function uploadPDF(file: File, projectId: string): Promise<Source> {
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
 */
export async function loadSources(projectId: string): Promise<Source[]> {
  return await tauri.loadSources(projectId);
}

/**
 * Delete a source and its file
 */
export async function deleteSource(sourceId: string, storagePath?: string): Promise<void> {
  // Delete from storage
  if (storagePath) {
    try {
      await tauri.deleteFile('sources', storagePath);
    } catch (error) {
      logger.warn('Failed to delete file from storage:', error);
    }
  }

  // Delete from database
  await tauri.deleteSource(sourceId);
}
