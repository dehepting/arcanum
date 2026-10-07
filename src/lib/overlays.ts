import * as tauri from './tauri';
import type { MapOverlay } from '../types/store';

interface UploadResult {
  fileName: string;
  storagePath: string;
}

/**
 * Upload a map overlay image
 */
export async function uploadOverlay(file: File, projectId: string): Promise<UploadResult> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Generate file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${projectId}/${Date.now()}.${fileExt}`;

  // Upload to local storage
  const result = await tauri.uploadFile('map-overlays', fileName, data);

  return {
    fileName,
    storagePath: result.storage_path,
  };
}

/**
 * Create a new map overlay with georeferencing
 */
export async function createOverlay(overlayData: Partial<MapOverlay>): Promise<MapOverlay> {
  return await tauri.createOverlay(overlayData);
}

/**
 * Load all overlays for a project
 */
export async function loadOverlays(projectId: string): Promise<MapOverlay[]> {
  return await tauri.loadOverlays(projectId);
}

/**
 * Update overlay properties (opacity, visibility, etc.)
 */
export async function updateOverlay(
  overlayId: string,
  updates: Partial<MapOverlay>
): Promise<MapOverlay> {
  return await tauri.updateOverlay(overlayId, updates);
}

/**
 * Delete an overlay
 */
export async function deleteOverlay(overlayId: string, storagePath?: string): Promise<void> {
  // Delete from database
  await tauri.deleteOverlay(overlayId);

  // Delete from storage
  if (storagePath) {
    await tauri.deleteFile('map-overlays', storagePath);
  }
}
