/**
 * Zod Schemas for Entity Validation
 *
 * Runtime validation schemas that match TypeScript entity types.
 * Used to validate data from Tauri API calls and external sources.
 */

import { z } from 'zod';

/**
 * Entity type enum
 */
export const EntityTypeSchema = z.enum(['person', 'event', 'theory', 'place', 'artifact']);

/**
 * Base entity schema - shared properties
 */
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullish(),
  metadata: z.string().nullish(), // JSON string
  lng: z.number().min(-180).max(180).nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Person entity schema
 */
export const PersonSchema = BaseEntitySchema.extend({
  birth_date: z.string().nullish(),
  death_date: z.string().nullish(),
  occupation: z.string().nullish(),
});

/**
 * Event entity schema
 */
export const EventSchema = BaseEntitySchema.extend({
  event_date: z.string().nullish(),
  location: z.string().nullish(),
});

/**
 * Theory entity schema
 */
export const TheorySchema = BaseEntitySchema.extend({
  // Theory has all BaseEntity properties, no additional fields
});

/**
 * Place entity schema - lng/lat are required
 */
export const PlaceSchema = BaseEntitySchema.omit({ lng: true, lat: true }).extend({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  place_type: z.string().nullish(),
});

/**
 * Artifact entity schema
 */
export const ArtifactSchema = BaseEntitySchema.extend({
  category: z.string().nullish(),
  subcategory: z.string().nullish(),
  period: z.string().nullish(),
  estimated_age: z.string().nullish(),
  date_found: z.string().nullish(),
  date_range: z.string().nullish(),
  findspot_place_id: z.string().uuid().nullish(),
  findspot_description: z.string().nullish(),
  findspot: PlaceSchema.nullish(),
  excavation_notes: z.string().nullish(),
  current_owner: z.string().nullish(),
  current_location: z.string().nullish(),
  owner_type: z.string().nullish(),
  owner_name: z.string().nullish(),
  accession_number: z.string().nullish(),
  material: z.string().nullish(),
  dimensions: z.string().nullish(),
  weight: z.string().nullish(),
  condition: z.string().nullish(),
  notes: z.string().nullish(),
  images: z.string().nullish(), // JSON array string
  image_urls: z.array(z.string().url()).nullish(),
  has_disputed_ownership: z.boolean().nullish(),
});

/**
 * Union schema for any entity
 */
export const EntitySchema = z.union([
  PersonSchema,
  EventSchema,
  TheorySchema,
  PlaceSchema,
  ArtifactSchema,
]);

/**
 * Create entity input schemas
 */
export const CreatePersonInputSchema = PersonSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  annotation_id: z.string().uuid().nullish(),
  relationship_type: z.string().nullish(),
});

export const CreateEventInputSchema = EventSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  annotation_id: z.string().uuid().nullish(),
  relationship_type: z.string().nullish(),
});

export const CreateTheoryInputSchema = TheorySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  annotation_id: z.string().uuid().nullish(),
  relationship_type: z.string().nullish(),
});

export const CreatePlaceInputSchema = PlaceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  annotation_id: z.string().uuid().nullish(),
});

export const CreateArtifactInputSchema = ArtifactSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  annotation_id: z.string().uuid().nullish(),
  relationship_type: z.string().nullish(),
});

/**
 * Update entity input schemas (all fields optional except ID)
 */
export const UpdatePersonInputSchema = PersonSchema.omit({
  id: true,
  project_id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const UpdateEventInputSchema = EventSchema.omit({
  id: true,
  project_id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const UpdateTheoryInputSchema = TheorySchema.omit({
  id: true,
  project_id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const UpdatePlaceInputSchema = PlaceSchema.omit({
  id: true,
  project_id: true,
  created_at: true,
  updated_at: true,
}).partial();

export const UpdateArtifactInputSchema = ArtifactSchema.omit({
  id: true,
  project_id: true,
  created_at: true,
  updated_at: true,
}).partial();

/**
 * Entity link schema (for knowledge graph relationships)
 */
export const EntityLinkSchema = z.object({
  id: z.string().uuid(),
  source_entity_id: z.string().uuid(),
  source_entity_type: EntityTypeSchema,
  target_entity_id: z.string().uuid(),
  target_entity_type: EntityTypeSchema,
  relationship_type: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

/**
 * Annotation-Entity link schema
 */
export const AnnotationEntityLinkSchema = z.object({
  id: z.string().uuid(),
  annotation_id: z.string().uuid(),
  entity_id: z.string().uuid(),
  entity_type: EntityTypeSchema,
  relationship_type: z.string(),
  created_at: z.string(),
});

/**
 * Entity page schema
 */
export const EntityPageSchema = z.object({
  entity_id: z.string().uuid(),
  entity_type: EntityTypeSchema,
  project_id: z.string().uuid(),
  content_path: z.string(),
  updated_at: z.string(),
});
