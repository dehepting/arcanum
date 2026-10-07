import * as tauri from './tauri';
import type { Event, CreateEventInput, UpdateEventInput } from '../types/entities';

/**
 * Create a new event
 */
export async function createEvent(eventData: CreateEventInput): Promise<Event> {
  return await tauri.createEvent(eventData);
}

/**
 * Update an event's properties
 */
export async function updateEvent(eventId: string, updates: UpdateEventInput): Promise<Event> {
  return await tauri.updateEvent(eventId, updates);
}

/**
 * Load all events for a project
 */
export async function loadEvents(projectId: string): Promise<Event[]> {
  return await tauri.loadEvents(projectId);
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  return await tauri.deleteEvent(eventId);
}
