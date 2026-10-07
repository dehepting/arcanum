/**
 * Zod Schemas
 *
 * Central export point for all validation schemas.
 */

// Common schemas
export { ProjectSchema, SourceSchema, MapOverlaySchema, FileReadResultSchema } from './common';

// Entity schemas
export {
  EntityTypeSchema,
  BaseEntitySchema,
  PersonSchema,
  EventSchema,
  TheorySchema,
  PlaceSchema,
  ArtifactSchema,
  EntitySchema,
  CreatePersonInputSchema,
  CreateEventInputSchema,
  CreateTheoryInputSchema,
  CreatePlaceInputSchema,
  CreateArtifactInputSchema,
  UpdatePersonInputSchema,
  UpdateEventInputSchema,
  UpdateTheoryInputSchema,
  UpdatePlaceInputSchema,
  UpdateArtifactInputSchema,
  EntityLinkSchema,
  AnnotationEntityLinkSchema,
  EntityPageSchema,
} from './entities';

// Annotation schemas
export {
  AnnotationTypeSchema,
  GeometrySchema,
  InkMetadataSchema,
  AnnotationSchema,
  AnnotationWithGeometrySchema,
  InkAnnotationSchema,
  CreateAnnotationInputSchema,
  UpdateAnnotationInputSchema,
  AnnotationWithLinksSchema,
  PlacePinSchema,
  ArtifactAnnotationLinkSchema,
} from './annotations';

// API validation helpers
export {
  validate,
  validateOrThrow,
  validateArray,
  validateArrayOrThrow,
  validateOptional,
  createTauriValidator,
  createTauriArrayValidator,
  type ValidationResult,
} from './api';
