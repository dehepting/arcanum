import { supabase } from './supabase';

/**
 * Get provenance history for an artifact
 */
export async function getProvenance(artifactId) {
  const { data, error } = await supabase
    .from('artifact_provenance')
    .select('*')
    .eq('artifact_id', artifactId)
    .order('sequence_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new provenance entry
 */
export async function createProvenanceEntry(entryData) {
  const { data, error } = await supabase
    .from('artifact_provenance')
    .insert([
      {
        ...entryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a provenance entry
 */
export async function updateProvenanceEntry(entryId, updates) {
  const { data, error } = await supabase
    .from('artifact_provenance')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a provenance entry
 */
export async function deleteProvenanceEntry(entryId) {
  const { error } = await supabase.from('artifact_provenance').delete().eq('id', entryId);

  if (error) throw error;
}

/**
 * Reorder provenance entries
 */
export async function reorderProvenance(artifactId, orderedIds) {
  const updates = orderedIds.map((id, index) => ({
    id,
    sequence_order: index,
  }));

  const { error } = await supabase.from('artifact_provenance').upsert(updates);

  if (error) throw error;
}

/**
 * Get claims for an artifact
 */
export async function getClaims(artifactId) {
  const { data, error } = await supabase
    .from('artifact_claims')
    .select('*')
    .eq('artifact_id', artifactId)
    .order('claim_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new claim
 */
export async function createClaim(claimData) {
  const { data, error } = await supabase
    .from('artifact_claims')
    .insert([
      {
        ...claimData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a claim
 */
export async function updateClaim(claimId, updates) {
  const { data, error } = await supabase
    .from('artifact_claims')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a claim
 */
export async function deleteClaim(claimId) {
  const { error } = await supabase.from('artifact_claims').delete().eq('id', claimId);

  if (error) throw error;
}

/**
 * Get artifacts with disputed ownership
 */
export async function getDisputedArtifacts(projectId) {
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('project_id', projectId)
    .eq('has_disputed_ownership', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}
