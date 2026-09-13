import { supabase } from './supabase';

/**
 * Link an artifact to a PDF annotation
 * @param {string} artifactId - UUID of the artifact
 * @param {string} annotationId - UUID of the annotation
 * @param {string} quote - Excerpt from the PDF
 * @param {string} context - Additional context/notes
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function linkArtifactToAnnotation(artifactId, annotationId, quote = '', context = '') {
  try {
    const { data, error } = await supabase
      .from('artifact_source_links')
      .insert({
        artifact_id: artifactId,
        annotation_id: annotationId,
        quote,
        context,
      })
      .select()
      .single();

    if (error) {
      console.error('Error linking artifact to annotation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception linking artifact to annotation:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Unlink an artifact from an annotation
 * @param {string} artifactId - UUID of the artifact
 * @param {string} annotationId - UUID of the annotation
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unlinkArtifactFromAnnotation(artifactId, annotationId) {
  try {
    const { error } = await supabase
      .from('artifact_source_links')
      .delete()
      .eq('artifact_id', artifactId)
      .eq('annotation_id', annotationId);

    if (error) {
      console.error('Error unlinking artifact from annotation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception unlinking artifact from annotation:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all source references (linked annotations) for an artifact
 * @param {string} artifactId - UUID of the artifact
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getSourcesForArtifact(artifactId) {
  try {
    const { data, error } = await supabase
      .from('artifact_source_links')
      .select(
        `
        id,
        annotation_id,
        quote,
        context,
        created_at,
        annotations (
          id,
          source_id,
          page_number,
          type,
          text,
          content,
          sources (
            id,
            title,
            filename
          )
        )
      `
      )
      .eq('artifact_id', artifactId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sources for artifact:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Exception fetching sources for artifact:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all artifacts linked to a specific annotation
 * @param {string} annotationId - UUID of the annotation
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getArtifactsForAnnotation(annotationId) {
  try {
    const { data, error } = await supabase
      .from('artifact_source_links')
      .select(
        `
        id,
        artifact_id,
        quote,
        context,
        created_at,
        artifacts (
          id,
          name,
          category,
          image_urls,
          description
        )
      `
      )
      .eq('annotation_id', annotationId);

    if (error) {
      console.error('Error fetching artifacts for annotation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Exception fetching artifacts for annotation:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all artifacts mentioned in a PDF source
 * @param {string} sourceId - UUID of the source
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getArtifactsForSource(sourceId) {
  try {
    // First get all annotations for this source
    const { data: annotations, error: annotError } = await supabase
      .from('annotations')
      .select('id')
      .eq('source_id', sourceId);

    if (annotError) {
      console.error('Error fetching annotations for source:', annotError);
      return { success: false, error: annotError.message };
    }

    if (!annotations || annotations.length === 0) {
      return { success: true, data: [] };
    }

    const annotationIds = annotations.map((a) => a.id);

    // Get all artifact links for these annotations
    const { data, error } = await supabase
      .from('artifact_source_links')
      .select(
        `
        id,
        artifact_id,
        annotation_id,
        quote,
        context,
        artifacts (
          id,
          name,
          category,
          image_urls,
          description
        ),
        annotations (
          id,
          page_number,
          text
        )
      `
      )
      .in('annotation_id', annotationIds);

    if (error) {
      console.error('Error fetching artifacts for source:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Exception fetching artifacts for source:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if an artifact is linked to an annotation
 * @param {string} artifactId - UUID of the artifact
 * @param {string} annotationId - UUID of the annotation
 * @returns {Promise<{success: boolean, linked: boolean, data?: object, error?: string}>}
 */
export async function checkArtifactLink(artifactId, annotationId) {
  try {
    const { data, error } = await supabase
      .from('artifact_source_links')
      .select('*')
      .eq('artifact_id', artifactId)
      .eq('annotation_id', annotationId)
      .maybeSingle();

    if (error) {
      console.error('Error checking artifact link:', error);
      return { success: false, linked: false, error: error.message };
    }

    return { success: true, linked: !!data, data };
  } catch (err) {
    console.error('Exception checking artifact link:', err);
    return { success: false, linked: false, error: err.message };
  }
}
