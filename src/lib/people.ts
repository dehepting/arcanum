import * as tauri from './tauri';
import { invoke } from '@tauri-apps/api/core';
import type { Person, CreatePersonInput, UpdatePersonInput } from '../types/entities';

/**
 * Create a new person and optionally link to annotation
 */
export async function createPerson(
  personData: CreatePersonInput,
  annotationId: string | null = null,
  relationshipType: string = 'mentions'
): Promise<Person> {
  return await tauri.createPerson(personData, annotationId, relationshipType);
}

/**
 * Update a person's properties
 */
export async function updatePerson(personId: string, updates: UpdatePersonInput): Promise<Person> {
  return await tauri.updatePerson(personId, updates);
}

/**
 * Load all people for a project
 */
export async function loadPeople(projectId: string): Promise<Person[]> {
  return await tauri.loadPeople(projectId);
}

/**
 * Delete a person
 */
export async function deletePerson(personId: string): Promise<void> {
  return await tauri.deletePerson(personId);
}

/**
 * Link a person to an annotation
 */
export async function linkPersonToAnnotation(
  annotationId: string,
  personId: string,
  relationshipType: string = 'mentions'
): Promise<void> {
  return await tauri.linkPersonToAnnotation(annotationId, personId, relationshipType);
}

/**
 * Unlink a person from an annotation
 */
export async function unlinkPersonFromAnnotation(
  annotationId: string,
  personId: string
): Promise<void> {
  return await invoke('unlink_annotation_from_person', {
    annotationId,
    personId,
  });
}
