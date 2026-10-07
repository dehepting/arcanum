import * as tauri from './tauri';
import { invoke } from '@tauri-apps/api/core';
import type { Theory, CreateTheoryInput, UpdateTheoryInput } from '../types/entities';

/**
 * Create a new theory and optionally link to annotation
 */
export async function createTheory(
  theoryData: CreateTheoryInput,
  annotationId: string | null = null
): Promise<Theory> {
  return await tauri.createTheory(theoryData, annotationId);
}

/**
 * Update a theory's properties
 */
export async function updateTheory(theoryId: string, updates: UpdateTheoryInput): Promise<Theory> {
  return await tauri.updateTheory(theoryId, updates);
}

/**
 * Load all theories for a project
 */
export async function loadTheories(projectId: string): Promise<Theory[]> {
  return await tauri.loadTheories(projectId);
}

/**
 * Delete a theory
 */
export async function deleteTheory(theoryId: string): Promise<void> {
  return await tauri.deleteTheory(theoryId);
}

/**
 * Link a theory to an annotation
 */
export async function linkTheoryToAnnotation(
  annotationId: string,
  theoryId: string
): Promise<void> {
  return await tauri.linkTheoryToAnnotation(annotationId, theoryId);
}

/**
 * Unlink a theory from an annotation
 */
export async function unlinkTheoryFromAnnotation(
  annotationId: string,
  theoryId: string
): Promise<void> {
  return await invoke('unlink_annotation_from_theory', {
    annotationId,
    theoryId,
  });
}
