import * as tauri from './tauri';

/**
 * Create a new place (map pin)
 */
export async function createPlace(placeData) {
  return await tauri.createPlace(placeData);
}

/**
 * Update a place's properties
 */
export async function updatePlace(placeId, updates) {
  return await tauri.updatePlace(placeId, updates);
}

/**
 * Load all places for a project
 */
export async function loadPlaces(projectId) {
  return await tauri.loadPlaces(projectId);
}

/**
 * Delete a place and its links
 */
export async function deletePlace(placeId) {
  return await tauri.deletePlace(placeId);
}
