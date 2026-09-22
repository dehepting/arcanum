import * as tauri from './tauri';

/**
 * Create a new event
 */
export async function createEvent(eventData) {
  return await tauri.createEvent(eventData);
}

/**
 * Update an event's properties
 */
export async function updateEvent(eventId, updates) {
  return await tauri.updateEvent(eventId, updates);
}

/**
 * Load all events for a project
 */
export async function loadEvents(projectId) {
  return await tauri.loadEvents(projectId);
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId) {
  return await tauri.deleteEvent(eventId);
}
