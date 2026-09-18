import { supabase } from './supabase';

/**
 * Create a new theory and optionally link to annotation
 * @param {Object} theoryData - { project_id, name, description, proposed_location_id, status, confidence_level, notes }
 * @param {string} annotationId - Optional annotation ID to link
 * @param {string} relationshipType - Type of relationship (supports, contradicts, mentions)
 * @returns {Promise<Object>} The created theory
 */
export async function createTheory(theoryData, annotationId = null, relationshipType = 'supports') {
  // Create the theory
  const { data: theory, error: theoryError } = await supabase
    .from('theories')
    .insert([theoryData])
    .select()
    .single();

  if (theoryError) {
    throw new Error(`Failed to create theory: ${theoryError.message}`);
  }

  // Link to annotation if provided
  if (annotationId) {
    const { error: linkError } = await supabase.from('annotation_theories_links').insert([
      {
        annotation_id: annotationId,
        theory_id: theory.id,
        relationship_type: relationshipType,
      },
    ]);

    if (linkError) {
      throw new Error(`Failed to link annotation to theory: ${linkError.message}`);
    }
  }

  return theory;
}

/**
 * Update a theory's properties
 * @param {string} theoryId - The theory ID to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} The updated theory
 */
export async function updateTheory(theoryId, updates) {
  const { data, error } = await supabase
    .from('theories')
    .update(updates)
    .eq('id', theoryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update theory: ${error.message}`);
  }

  return data;
}

/**
 * Load all theories for a project with their linked annotations and proposed location
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of theories with annotations and location
 */
export async function loadTheories(projectId) {
  const { data, error } = await supabase
    .from('theories')
    .select(
      `
      *,
      annotation_theories_links (
        annotation_id,
        relationship_type
      ),
      places (
        id,
        name,
        lng,
        lat
      )
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load theories: ${error.message}`);
  }

  return data || [];
}

/**
 * Get theories linked to an annotation
 * @param {string} annotationId - The annotation ID
 * @returns {Promise<Array>} Array of linked theories with relationship info
 */
export async function getTheoriesForAnnotation(annotationId) {
  const { data, error } = await supabase
    .from('annotation_theories_links')
    .select(
      `
      relationship_type,
      quote,
      theories (*)
    `
    )
    .eq('annotation_id', annotationId);

  if (error) {
    throw new Error(`Failed to get theories: ${error.message}`);
  }

  return (
    data?.map((item) => ({
      ...item.theories,
      relationship_type: item.relationship_type,
      quote: item.quote,
    })) || []
  );
}

/**
 * Get theories for a proposed location
 * @param {string} placeId - The place ID
 * @returns {Promise<Array>} Array of theories proposing this location
 */
export async function getTheoriesForPlace(placeId) {
  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .eq('proposed_location_id', placeId);

  if (error) {
    throw new Error(`Failed to get theories for place: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a theory and its links
 * @param {string} theoryId - The theory ID to delete
 */
export async function deleteTheory(theoryId) {
  const { error } = await supabase.from('theories').delete().eq('id', theoryId);

  if (error) {
    throw new Error(`Failed to delete theory: ${error.message}`);
  }
}

/**
 * Link theory to annotation
 * @param {string} theoryId - The theory ID
 * @param {string} annotationId - The annotation ID
 * @param {string} relationshipType - Type of relationship (supports, contradicts, mentions)
 * @param {string} quote - Optional quote from the annotation
 */
export async function linkTheoryToAnnotation(
  theoryId,
  annotationId,
  relationshipType = 'supports',
  quote = null
) {
  const { error } = await supabase.from('annotation_theories_links').insert([
    {
      annotation_id: annotationId,
      theory_id: theoryId,
      relationship_type: relationshipType,
      quote,
    },
  ]);

  if (error) {
    throw new Error(`Failed to link theory to annotation: ${error.message}`);
  }
}

/**
 * Unlink theory from annotation
 * @param {string} theoryId - The theory ID
 * @param {string} annotationId - The annotation ID
 */
export async function unlinkTheoryFromAnnotation(theoryId, annotationId) {
  const { error } = await supabase
    .from('annotation_theories_links')
    .delete()
    .eq('theory_id', theoryId)
    .eq('annotation_id', annotationId);

  if (error) {
    throw new Error(`Failed to unlink theory: ${error.message}`);
  }
}
