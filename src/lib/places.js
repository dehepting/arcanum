import { supabase } from './supabase';

/**
 * Create a new place (map pin) and optionally link to annotation
 * @param {Object} placeData - { project_id, name, lng, lat, note }
 * @param {string} annotationId - Optional annotation ID to link
 * @returns {Promise<Object>} The created place
 */
export async function createPlace(placeData, annotationId = null) {
  // Create the place
  const { data: place, error: placeError } = await supabase
    .from('places')
    .insert([placeData])
    .select()
    .single();

  if (placeError) {
    throw new Error(`Failed to create place: ${placeError.message}`);
  }

  // Link to annotation if provided
  if (annotationId) {
    const { error: linkError } = await supabase.from('annotation_place_links').insert([
      {
        annotation_id: annotationId,
        place_id: place.id,
      },
    ]);

    if (linkError) {
      throw new Error(`Failed to link annotation to place: ${linkError.message}`);
    }
  }

  return place;
}

/**
 * Load all places for a project with their linked annotations
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of places with annotations
 */
export async function loadPlaces(projectId) {
  const { data, error } = await supabase
    .from('places')
    .select(
      `
      *,
      annotation_place_links (
        annotation_id
      )
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load places: ${error.message}`);
  }

  return data || [];
}

/**
 * Get place linked to an annotation
 * @param {string} annotationId - The annotation ID
 * @returns {Promise<Object|null>} The linked place or null
 */
export async function getPlaceForAnnotation(annotationId) {
  const { data, error } = await supabase
    .from('annotation_place_links')
    .select(
      `
      place_id,
      places (*)
    `
    )
    .eq('annotation_id', annotationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw new Error(`Failed to get place: ${error.message}`);
  }

  return data?.places || null;
}

/**
 * Get annotations linked to a place
 * @param {string} placeId - The place ID
 * @returns {Promise<Array>} Array of linked annotations
 */
export async function getAnnotationsForPlace(placeId) {
  const { data, error } = await supabase
    .from('annotation_place_links')
    .select(
      `
      annotation_id,
      annotations (*)
    `
    )
    .eq('place_id', placeId);

  if (error) {
    throw new Error(`Failed to get annotations: ${error.message}`);
  }

  return data?.map((item) => item.annotations) || [];
}

/**
 * Delete a place and its links
 * @param {string} placeId - The place ID to delete
 */
export async function deletePlace(placeId) {
  const { error } = await supabase.from('places').delete().eq('id', placeId);

  if (error) {
    throw new Error(`Failed to delete place: ${error.message}`);
  }
}

/**
 * Unlink annotation from place
 * @param {string} annotationId - The annotation ID
 * @param {string} placeId - The place ID
 */
export async function unlinkAnnotationFromPlace(annotationId, placeId) {
  const { error } = await supabase
    .from('annotation_place_links')
    .delete()
    .eq('annotation_id', annotationId)
    .eq('place_id', placeId);

  if (error) {
    throw new Error(`Failed to unlink: ${error.message}`);
  }
}
