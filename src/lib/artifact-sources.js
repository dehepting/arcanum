// Artifact-source linking functionality
// TODO: Implement artifact_source_links table and backend commands

/**
 * Link an artifact to a PDF annotation
 */
export async function linkArtifactToAnnotation(artifactId, annotationId, quote = '', context = '') {
  console.warn(
    'linkArtifactToAnnotation not yet implemented - requires artifact_source_links table'
  );
  return { success: false, error: 'Not implemented' };
}

/**
 * Unlink an artifact from an annotation
 */
export async function unlinkArtifactFromAnnotation(artifactId, annotationId) {
  console.warn('unlinkArtifactFromAnnotation not yet implemented');
  return { success: false, error: 'Not implemented' };
}

/**
 * Get all source references for an artifact
 */
export async function getSourcesForArtifact(artifactId) {
  console.warn('getSourcesForArtifact not yet implemented');
  return { success: true, data: [] };
}

/**
 * Get all artifacts linked to an annotation
 */
export async function getArtifactsForAnnotation(annotationId) {
  console.warn('getArtifactsForAnnotation not yet implemented');
  return { success: true, data: [] };
}

/**
 * Get all artifacts mentioned in a PDF source
 */
export async function getArtifactsForSource(sourceId) {
  console.warn('getArtifactsForSource not yet implemented');
  return { success: true, data: [] };
}

/**
 * Check if an artifact is linked to an annotation
 */
export async function checkArtifactLink(artifactId, annotationId) {
  console.warn('checkArtifactLink not yet implemented');
  return { success: true, linked: false };
}
