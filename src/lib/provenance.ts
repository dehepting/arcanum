import * as tauri from './tauri';
import { logger } from '../utils/logger';
import type { EntityType } from '../types/entities';

/**
 * Get provenance history for an entity
 */
export async function getProvenance(entityId: string, entityType: EntityType = 'artifact') {
  return await tauri.getProvenance(entityId, entityType);
}

/**
 * Create a new provenance entry
 */
export async function createProvenanceEntry(entryData: any) {
  return await tauri.createProvenanceRecord(entryData);
}

/**
 * Update a provenance entry
 */
export async function updateProvenanceEntry(entryId: string, updates: any) {
  return await tauri.updateProvenanceRecord(entryId, updates);
}

/**
 * Delete a provenance entry
 */
export async function deleteProvenanceEntry(entryId: string): Promise<void> {
  return await tauri.deleteProvenanceRecord(entryId);
}

// Note: Claims and other provenance features from the old schema
// have been consolidated into the provenance_records table.
// Use event_type and event_data fields to distinguish different types of provenance records.

/**
 * Get claims for an artifact (compatibility function)
 */
export async function getClaims(artifactId: string) {
  const records = await getProvenance(artifactId, 'artifact');
  return records.filter((r) => r.event_type === 'claim');
}

/**
 * Create a new claim (compatibility function)
 */
export async function createClaim(claimData: any) {
  return await createProvenanceEntry({
    ...claimData,
    entity_type: 'artifact',
    event_type: 'claim',
    event_data: JSON.stringify(claimData),
  });
}

/**
 * Update a claim (compatibility function)
 */
export async function updateClaim(claimId: string, updates: any) {
  return await updateProvenanceEntry(claimId, {
    event_data: JSON.stringify(updates),
  });
}

/**
 * Delete a claim (compatibility function)
 */
export async function deleteClaim(claimId: string): Promise<void> {
  return await deleteProvenanceEntry(claimId);
}

/**
 * Reorder provenance entries (not implemented - can be added later if needed)
 */
export async function reorderProvenance(_artifactId: string, _orderedIds: string[]): Promise<void> {
  logger.warn('reorderProvenance not yet implemented in Tauri backend');
  // TODO: Add sequence_order field to provenance_records table if needed
}

/**
 * Get artifacts with disputed ownership (not implemented)
 */
export async function getDisputedArtifacts(_projectId: string): Promise<any[]> {
  logger.warn('getDisputedArtifacts not yet implemented in Tauri backend');
  // TODO: Add has_disputed_ownership field to artifacts table if needed
  return [];
}
