/**
 * Zod Schemas for Annotation Validation
 *
 * Runtime validation schemas that match TypeScript annotation types.
 * Used to validate data from Tauri API calls and external sources.
 */

import { z } from 'zod';

/**
 * Annotation type enum
 */
export const AnnotationTypeSchema = z.enum(['highlight', 'text', 'ink']);

/**
 * Normalized geometry schema (coordinates in 0-1 range)
 */
export const GeometrySchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});

/**
 * Ink metadata schema
 */
export const InkMetadataSchema = z
  .object({
    ink_data: z.string(), // Serialized Fabric.js JSON
  })
  .catchall(z.unknown()); // Allow other metadata fields

/**
 * Base annotation schema
 */
export const AnnotationSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  project_id: z.string().uuid(),
  page_number: z.number().int().nonnegative().optional(),
  annotation_type: AnnotationTypeSchema,
  content: z.string().optional(),
  geometry: z.string().optional(), // JSON string of Geometry
  metadata: z.string().optional(), // JSON string, often InkMetadata
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Annotation with parsed geometry
 */
export const AnnotationWithGeometrySchema = AnnotationSchema.omit({ geometry: true }).extend({
  geometry: GeometrySchema.optional(),
});

/**
 * Ink annotation with parsed metadata
 */
export const InkAnnotationSchema = AnnotationSchema.omit({
  metadata: true,
  geometry: true,
  annotation_type: true,
}).extend({
  annotation_type: z.literal('ink'),
  geometry: GeometrySchema.optional(),
  metadata: InkMetadataSchema.optional(),
});

/**
 * Create annotation input schema
 */
export const CreateAnnotationInputSchema = z.object({
  source_id: z.string().uuid(),
  project_id: z.string().uuid(),
  page_number: z.number().int().nonnegative().optional(),
  annotation_type: AnnotationTypeSchema,
  content: z.string().optional(),
  geometry: z.union([GeometrySchema, z.string()]).optional(), // Accept parsed or stringified
  metadata: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(), // Accept parsed or stringified
});

/**
 * Update annotation input schema
 */
export const UpdateAnnotationInputSchema = z.object({
  content: z.string().optional(),
  geometry: z.union([GeometrySchema, z.string()]).optional(),
  metadata: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
});

/**
 * Annotation with linked entities
 */
export const AnnotationWithLinksSchema = AnnotationSchema.extend({
  linkedPeople: z.array(z.string().uuid()).optional(),
  linkedEvents: z.array(z.string().uuid()).optional(),
  linkedTheories: z.array(z.string().uuid()).optional(),
  linkedPlaces: z.array(z.string().uuid()).optional(),
  linkedArtifacts: z.array(z.string().uuid()).optional(),
});

/**
 * Place pin schema (connects annotation to map location)
 */
export const PlacePinSchema = z.object({
  id: z.string().uuid(),
  annotation_id: z.string().uuid(),
  place_id: z.string().uuid(),
  created_at: z.string(),
});

/**
 * Artifact annotation link schema
 */
export const ArtifactAnnotationLinkSchema = z.object({
  id: z.string().uuid(),
  annotation_id: z.string().uuid(),
  artifact_id: z.string().uuid(),
  created_at: z.string(),
});
