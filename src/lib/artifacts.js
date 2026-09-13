import { supabase } from './supabase';

const ARTIFACTS_BUCKET = 'artifacts';

/**
 * Upload an artifact image to Supabase Storage
 */
export async function uploadArtifactImage(file, projectId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(ARTIFACTS_BUCKET)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(ARTIFACTS_BUCKET).getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Create a new artifact
 */
export async function createArtifact(artifactData) {
  const { data, error } = await supabase
    .from('artifacts')
    .insert([
      {
        ...artifactData,
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
 * Load all artifacts for a project
 */
export async function loadArtifacts(projectId) {
  const { data, error } = await supabase
    .from('artifacts')
    .select(
      `
      *,
      findspot:findspot_place_id (
        id,
        name,
        lng,
        lat
      )
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single artifact by ID
 */
export async function getArtifact(artifactId) {
  const { data, error } = await supabase
    .from('artifacts')
    .select(
      `
      *,
      findspot:findspot_place_id (
        id,
        name,
        lng,
        lat
      )
    `
    )
    .eq('id', artifactId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an artifact
 */
export async function updateArtifact(artifactId, updates) {
  const { data, error } = await supabase
    .from('artifacts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', artifactId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an artifact and its images
 */
export async function deleteArtifact(artifactId, imageUrls) {
  // Delete from database
  const { error: dbError } = await supabase.from('artifacts').delete().eq('id', artifactId);

  if (dbError) throw dbError;

  // Delete images from storage
  if (imageUrls && imageUrls.length > 0) {
    const fileNames = imageUrls.map((url) => {
      const parts = url.split('/');
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    });

    await supabase.storage.from(ARTIFACTS_BUCKET).remove(fileNames);
  }
}

/**
 * Get artifacts by findspot (place)
 */
export async function getArtifactsByFindspot(placeId) {
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('findspot_place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Search artifacts
 */
export async function searchArtifacts(projectId, query, filters = {}) {
  let queryBuilder = supabase.from('artifacts').select('*').eq('project_id', projectId);

  // Text search
  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  // Category filter
  if (filters.category) {
    queryBuilder = queryBuilder.eq('category', filters.category);
  }

  // Owner type filter
  if (filters.ownerType) {
    queryBuilder = queryBuilder.eq('owner_type', filters.ownerType);
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
