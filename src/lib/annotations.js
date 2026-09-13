import { supabase } from './supabase';

/**
 * Load all annotations for a source
 * @param {string} sourceId - The source ID
 * @returns {Promise<Array>} Array of annotation records
 */
export async function loadAnnotations(sourceId) {
  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('source_id', sourceId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load annotations: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete an annotation
 * @param {string} annotationId - The annotation ID to delete
 */
export async function deleteAnnotation(annotationId) {
  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('id', annotationId);

  if (error) {
    throw new Error(`Failed to delete annotation: ${error.message}`);
  }
}

/**
 * Update an annotation's text
 * @param {string} annotationId - The annotation ID
 * @param {string} text - New text content
 */
export async function updateAnnotationText(annotationId, text) {
  const { data, error } = await supabase
    .from('annotations')
    .update({ text })
    .eq('id', annotationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update annotation: ${error.message}`);
  }

  return data;
}
