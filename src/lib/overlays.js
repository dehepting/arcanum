import { supabase } from './supabase';

const OVERLAYS_BUCKET = 'overlays';

/**
 * Upload a map overlay image to Supabase Storage
 */
export async function uploadOverlay(file, projectId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${projectId}/${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(OVERLAYS_BUCKET)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(OVERLAYS_BUCKET).getPublicUrl(fileName);

  return {
    fileName,
    publicUrl,
  };
}

/**
 * Create a new map overlay with georeferencing
 */
export async function createOverlay(overlayData) {
  const { data, error } = await supabase
    .from('map_overlays')
    .insert([overlayData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Load all overlays for a project
 */
export async function loadOverlays(projectId) {
  const { data, error } = await supabase
    .from('map_overlays')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update overlay properties (opacity, visibility, etc.)
 */
export async function updateOverlay(overlayId, updates) {
  const { data, error } = await supabase
    .from('map_overlays')
    .update(updates)
    .eq('id', overlayId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an overlay
 */
export async function deleteOverlay(overlayId, imageUrl) {
  // Delete from database
  const { error: dbError } = await supabase.from('map_overlays').delete().eq('id', overlayId);

  if (dbError) throw dbError;

  // Delete from storage
  if (imageUrl) {
    const fileName = imageUrl.split('/').slice(-2).join('/'); // Get "projectId/timestamp.ext"
    await supabase.storage.from(OVERLAYS_BUCKET).remove([fileName]);
  }
}
