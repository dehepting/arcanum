/**
 * Entity Type Definitions
 *
 * Core entity types for Arcanum's knowledge graph.
 * Matches backend Rust structures for type safety across the stack.
 */

/**
 * Base properties shared by all entities
 */
export interface BaseEntity {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  metadata?: string; // JSON string
  lng?: number;
  lat?: number;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

/**
 * Person entity - Historical figure, researcher, author, etc.
 */
export interface Person extends BaseEntity {
  birth_date?: string;
  death_date?: string;
  occupation?: string;
}

/**
 * Event entity - Historical event, occurrence, happening
 */
export interface Event extends BaseEntity {
  event_date?: string;
  location?: string;
}

/**
 * Theory entity - Hypothesis, interpretation, scholarly argument
 */
export interface Theory extends BaseEntity {
  // Theory has all BaseEntity properties, no additional fields
}

/**
 * Place entity - Geographic location, site, region
 */
export interface Place extends Omit<BaseEntity, 'lng' | 'lat'> {
  lng: number; // Required for places
  lat: number; // Required for places
  place_type?: string;
}

/**
 * Artifact entity - Physical object, document, artifact
 */
export interface Artifact extends BaseEntity {
  category?: string;
  date_range?: string;
  owner_type?: string;
  owner_name?: string;
  findspot_place_id?: string;
  images?: string; // JSON array of image paths
}

/**
 * Union type of all entity types
 */
export type Entity = Person | Event | Theory | Place | Artifact;

/**
 * Entity type discriminator
 */
export type EntityType = 'person' | 'event' | 'theory' | 'place' | 'artifact';

/**
 * Map entity type string to entity interface
 */
export type EntityTypeMap = {
  person: Person;
  event: Event;
  theory: Theory;
  place: Place;
  artifact: Artifact;
};

/**
 * Create entity input types (for API calls)
 */
export type CreatePersonInput = Omit<Person, 'id' | 'created_at' | 'updated_at'> & {
  annotation_id?: string;
  relationship_type?: string;
};

export type CreateEventInput = Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
  annotation_id?: string;
  relationship_type?: string;
};

export type CreateTheoryInput = Omit<Theory, 'id' | 'created_at' | 'updated_at'> & {
  annotation_id?: string;
  relationship_type?: string;
};

export type CreatePlaceInput = Omit<Place, 'id' | 'created_at' | 'updated_at'> & {
  annotation_id?: string;
};

export type CreateArtifactInput = Omit<Artifact, 'id' | 'created_at' | 'updated_at'> & {
  annotation_id?: string;
  relationship_type?: string;
};

/**
 * Update entity input types (for API calls - all fields optional except ID)
 */
export type UpdatePersonInput = Partial<
  Omit<Person, 'id' | 'project_id' | 'created_at' | 'updated_at'>
>;
export type UpdateEventInput = Partial<
  Omit<Event, 'id' | 'project_id' | 'created_at' | 'updated_at'>
>;
export type UpdateTheoryInput = Partial<
  Omit<Theory, 'id' | 'project_id' | 'created_at' | 'updated_at'>
>;
export type UpdatePlaceInput = Partial<
  Omit<Place, 'id' | 'project_id' | 'created_at' | 'updated_at'>
>;
export type UpdateArtifactInput = Partial<
  Omit<Artifact, 'id' | 'project_id' | 'created_at' | 'updated_at'>
>;

/**
 * Entity link (for knowledge graph relationships)
 */
export interface EntityLink {
  id: string;
  source_entity_id: string;
  source_entity_type: EntityType;
  target_entity_id: string;
  target_entity_type: EntityType;
  relationship_type: string;
  created_at: string;
  updated_at: string;
}

/**
 * Annotation-Entity link (connects annotations to entities)
 */
export interface AnnotationEntityLink {
  id: string;
  annotation_id: string;
  entity_id: string;
  entity_type: EntityType;
  relationship_type: string;
  created_at: string;
}

/**
 * Entity page metadata (for rich text entity pages)
 */
export interface EntityPage {
  entity_id: string;
  entity_type: EntityType;
  project_id: string;
  content_path: string; // Path in Tauri FS to HTML content
  updated_at: string;
}
