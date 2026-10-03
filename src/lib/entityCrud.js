/**
 * Entity CRUD Factory
 * Generates consistent CRUD operations for entity types
 * Eliminates ~300 lines of duplicate code in tauri.js
 */
import { invoke } from '@tauri-apps/api/core';

/**
 * Creates CRUD operations for an entity type
 * @param {string} entityType - Singular entity name (person, event, theory, place, artifact)
 * @param {object} options - Configuration options
 * @param {boolean} options.hasAnnotationLink - Whether create supports annotation linking
 * @param {boolean} options.hasRelationshipType - Whether annotation links use relationship_type
 * @param {string} options.pluralOverride - Override for plural form (e.g., 'people' instead of 'persons')
 * @returns {object} CRUD operations { create, update, load, delete, linkToAnnotation }
 */
export function createEntityCrud(entityType, options = {}) {
  const { hasAnnotationLink = false, hasRelationshipType = false, pluralOverride = null } = options;

  // Generate naming conventions
  const entityCapitalized = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const pluralForm = pluralOverride || `${entityType}s`;
  const idParam = `${entityType}Id`;

  return {
    /**
     * Create entity
     * @param {object} data - Entity data
     * @param {string} annotationId - Optional annotation ID to link (if hasAnnotationLink)
     * @param {string} relationshipType - Optional relationship type (if hasRelationshipType)
     */
    create: async (data, annotationId = null, relationshipType = 'mentions') => {
      let input = { ...data };

      // Add annotation linking if supported
      if (hasAnnotationLink && annotationId) {
        input.annotation_id = annotationId;
        if (hasRelationshipType) {
          input.relationship_type = relationshipType;
        }
      }

      return await invoke(`create_${entityType}`, { input });
    },

    /**
     * Update entity
     * @param {string} id - Entity ID
     * @param {object} updates - Fields to update
     */
    update: async (id, updates) => {
      return await invoke(`update_${entityType}`, {
        [idParam]: id,
        input: updates,
      });
    },

    /**
     * Load all entities for a project
     * @param {string} projectId - Project ID
     */
    load: async (projectId) => {
      return await invoke(`list_${pluralForm}`, { projectId });
    },

    /**
     * Delete entity
     * @param {string} id - Entity ID
     */
    delete: async (id) => {
      return await invoke(`delete_${entityType}`, { [idParam]: id });
    },

    /**
     * Link entity to annotation (if hasAnnotationLink)
     * @param {string} annotationId - Annotation ID
     * @param {string} entityId - Entity ID
     * @param {string} relationshipType - Relationship type (if hasRelationshipType)
     */
    linkToAnnotation:
      hasAnnotationLink || hasRelationshipType
        ? async (annotationId, entityId, relationshipType = 'mentions') => {
            const params = {
              annotationId,
              [idParam]: entityId,
            };
            if (hasRelationshipType) {
              params.relationshipType = relationshipType;
            }
            return await invoke(`link_annotation_to_${entityType}`, params);
          }
        : null,
  };
}

// Pre-configured CRUD operations for each entity type
export const personCrud = createEntityCrud('person', {
  hasAnnotationLink: true,
  hasRelationshipType: true,
  pluralOverride: 'people',
});

export const eventCrud = createEntityCrud('event', {
  hasAnnotationLink: false,
  hasRelationshipType: false,
});

export const theoryCrud = createEntityCrud('theory', {
  hasAnnotationLink: true,
  hasRelationshipType: false,
  pluralOverride: 'theories',
});

export const placeCrud = createEntityCrud('place', {
  hasAnnotationLink: false,
  hasRelationshipType: false,
});

export const artifactCrud = createEntityCrud('artifact', {
  hasAnnotationLink: false,
  hasRelationshipType: false,
});

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
