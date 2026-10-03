/**
 * Entity CRUD Factory
 * Generates consistent CRUD operations for entity types
 * Eliminates ~300 lines of duplicate code in tauri.js
 */
import { invoke } from '@tauri-apps/api/core';
import type {
  Person,
  Event,
  Theory,
  Place,
  Artifact,
  CreatePersonInput,
  CreateEventInput,
  CreateTheoryInput,
  CreatePlaceInput,
  CreateArtifactInput,
  UpdatePersonInput,
  UpdateEventInput,
  UpdateTheoryInput,
  UpdatePlaceInput,
  UpdateArtifactInput,
} from '@/types';

/**
 * Configuration options for entity CRUD factory
 */
export interface EntityCrudOptions {
  hasAnnotationLink?: boolean;
  hasRelationshipType?: boolean;
  pluralOverride?: string | null;
}

/**
 * CRUD operations interface
 */
export interface EntityCrudOperations<TEntity, TCreateInput, TUpdateInput> {
  create: (
    data: TCreateInput,
    annotationId?: string | null,
    relationshipType?: string
  ) => Promise<TEntity>;
  update: (id: string, updates: TUpdateInput) => Promise<TEntity>;
  load: (projectId: string) => Promise<TEntity[]>;
  delete: (id: string) => Promise<void>;
  linkToAnnotation:
    ((annotationId: string, entityId: string, relationshipType?: string) => Promise<void>) | null;
}

/**
 * Creates CRUD operations for an entity type
 * @param entityType - Singular entity name (person, event, theory, place, artifact)
 * @param options - Configuration options
 * @returns CRUD operations { create, update, load, delete, linkToAnnotation }
 */
export function createEntityCrud<TEntity, TCreateInput, TUpdateInput>(
  entityType: string,
  options: EntityCrudOptions = {}
): EntityCrudOperations<TEntity, TCreateInput, TUpdateInput> {
  const { hasAnnotationLink = false, hasRelationshipType = false, pluralOverride = null } = options;

  // Generate naming conventions
  const entityCapitalized = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const pluralForm = pluralOverride || `${entityType}s`;
  const idParam = `${entityType}Id`;

  return {
    /**
     * Create entity
     * @param data - Entity data
     * @param annotationId - Optional annotation ID to link (if hasAnnotationLink)
     * @param relationshipType - Optional relationship type (if hasRelationshipType)
     */
    create: async (
      data: TCreateInput,
      annotationId: string | null = null,
      relationshipType = 'mentions'
    ) => {
      const input: Record<string, unknown> = { ...data } as Record<string, unknown>;

      // Add annotation linking if supported
      if (hasAnnotationLink && annotationId) {
        input.annotation_id = annotationId;
        if (hasRelationshipType) {
          input.relationship_type = relationshipType;
        }
      }

      return await invoke<TEntity>(`create_${entityType}`, { input });
    },

    /**
     * Update entity
     * @param id - Entity ID
     * @param updates - Fields to update
     */
    update: async (id: string, updates: TUpdateInput) => {
      return await invoke<TEntity>(`update_${entityType}`, {
        [idParam]: id,
        input: updates,
      });
    },

    /**
     * Load all entities for a project
     * @param projectId - Project ID
     */
    load: async (projectId: string) => {
      return await invoke<TEntity[]>(`list_${pluralForm}`, { projectId });
    },

    /**
     * Delete entity
     * @param id - Entity ID
     */
    delete: async (id: string) => {
      return await invoke<void>(`delete_${entityType}`, { [idParam]: id });
    },

    /**
     * Link entity to annotation (if hasAnnotationLink)
     * @param annotationId - Annotation ID
     * @param entityId - Entity ID
     * @param relationshipType - Relationship type (if hasRelationshipType)
     */
    linkToAnnotation:
      hasAnnotationLink || hasRelationshipType
        ? async (annotationId: string, entityId: string, relationshipType = 'mentions') => {
            const params: Record<string, unknown> = {
              annotationId,
              [idParam]: entityId,
            };
            if (hasRelationshipType) {
              params.relationshipType = relationshipType;
            }
            return await invoke<void>(`link_annotation_to_${entityType}`, params);
          }
        : null,
  };
}

// Pre-configured CRUD operations for each entity type
export const personCrud = createEntityCrud<Person, CreatePersonInput, UpdatePersonInput>('person', {
  hasAnnotationLink: true,
  hasRelationshipType: true,
  pluralOverride: 'people',
});

export const eventCrud = createEntityCrud<Event, CreateEventInput, UpdateEventInput>('event', {
  hasAnnotationLink: false,
  hasRelationshipType: false,
});

export const theoryCrud = createEntityCrud<Theory, CreateTheoryInput, UpdateTheoryInput>('theory', {
  hasAnnotationLink: true,
  hasRelationshipType: false,
  pluralOverride: 'theories',
});

export const placeCrud = createEntityCrud<Place, CreatePlaceInput, UpdatePlaceInput>('place', {
  hasAnnotationLink: false,
  hasRelationshipType: false,
});

export const artifactCrud = createEntityCrud<Artifact, CreateArtifactInput, UpdateArtifactInput>(
  'artifact',
  {
    hasAnnotationLink: false,
    hasRelationshipType: false,
  }
);

// Legacy exports for backward compatibility
export const {
  create: createPerson,
  update: updatePerson,
  load: loadPeople,
  delete: deletePerson,
  linkToAnnotation: linkPersonToAnnotation,
} = personCrud;

export const {
  create: createEvent,
  update: updateEvent,
  load: loadEvents,
  delete: deleteEvent,
} = eventCrud;

export const {
  create: createTheory,
  update: updateTheory,
  load: loadTheories,
  delete: deleteTheory,
  linkToAnnotation: linkTheoryToAnnotation,
} = theoryCrud;

export const {
  create: createPlace,
  update: updatePlace,
  load: loadPlaces,
  delete: deletePlace,
} = placeCrud;

export const {
  create: createArtifact,
  update: updateArtifact,
  load: loadArtifacts,
  delete: deleteArtifact,
} = artifactCrud;
