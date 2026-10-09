/**
 * Annotation Type Definitions
 *
 * Types for PDF annotations, highlights, notes, and ink drawings.
 */

/**
 * Annotation type discriminator
 */
export type AnnotationType = 'highlight' | 'text' | 'ink';

/**
 * Normalized geometry (coordinates in 0-1 range relative to page)
 */
export interface Geometry {
  x: number; // 0-1, left edge
  y: number; // 0-1, top edge
  w: number; // 0-1, width
  h: number; // 0-1, height
}

/**
 * Ink annotation metadata (Fabric.js canvas data)
 */
export interface InkMetadata {
  ink_data: string; // Serialized Fabric.js JSON
  [key: string]: unknown; // Allow other metadata
}

/**
 * Base annotation
 */
export interface Annotation {
  id: string;
  source_id: string;
  project_id: string;
  page_number?: number | null;
  annotation_type: AnnotationType;
  content?: string | null;
  geometry?: string | null; // JSON string of Geometry
  metadata?: string | null; // JSON string, often InkMetadata for ink annotations
  created_at: string;
  updated_at: string;
}

/**
 * Parsed annotation with typed geometry
 */
export interface AnnotationWithGeometry extends Omit<Annotation, 'geometry'> {
  geometry?: Geometry | null;
}

/**
 * Parsed annotation with typed metadata
 */
export interface InkAnnotation extends Omit<Annotation, 'metadata' | 'geometry'> {
  annotation_type: 'ink';
  geometry?: Geometry | null;
  metadata?: InkMetadata | null;
}

/**
 * Create annotation input
 */
export interface CreateAnnotationInput {
  source_id: string;
  project_id: string;
  page_number?: number | null;
  annotation_type: AnnotationType;
  content?: string | null;
  geometry?: Geometry | string | null; // Accept parsed or stringified
  metadata?: Record<string, unknown> | string | null; // Accept parsed or stringified
}

/**
 * Update annotation input
 */
export interface UpdateAnnotationInput {
  content?: string | null;
  geometry?: Geometry | string | null;
  metadata?: Record<string, unknown> | string | null;
}

/**
 * Annotation with linked entities (for display)
 */
export interface AnnotationWithLinks extends Annotation {
  linkedPeople?: string[] | null;
  linkedEvents?: string[] | null;
  linkedTheories?: string[] | null;
  linkedPlaces?: string[] | null;
  linkedArtifacts?: string[] | null;
}

/**
 * Place pin (connects annotation to map location)
 */
export interface PlacePin {
  id: string;
  annotation_id: string;
  place_id: string;
  created_at: string;
}

/**
 * Artifact link (connects annotation to artifact)
 */
export interface ArtifactAnnotationLink {
  id: string;
  annotation_id: string;
  artifact_id: string;
  created_at: string;
}
