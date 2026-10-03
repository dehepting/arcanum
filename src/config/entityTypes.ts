/**
 * Entity Type Configuration
 * Single source of truth for all entity types in the system
 */

import type { EntityType } from '@/types';

/**
 * Form field types
 */
export type FieldType = 'text' | 'textarea' | 'number' | 'select';

/**
 * Select option for form fields
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Form field configuration
 */
export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: string | number;
  step?: number;
  options?: SelectOption[];
}

/**
 * Metadata field configuration (simpler than form fields)
 */
export interface MetadataField {
  key: string;
  label: string;
  type: string;
}

/**
 * Entity type configuration
 */
export interface EntityTypeConfig {
  singular: string;
  plural: string;
  label: string;
  labelPlural: string;
  icon: string;
  getCommand: string;
  updateCommand: string;
  createCommand: string;
  deleteCommand: string;
  listCommand: string;
  paramKey: string;
  hasLocation: boolean;
  metadataFields: MetadataField[];
  formFields: FormField[];
}

/**
 * Map of all entity types to their configurations
 */
export type EntityTypesConfig = Record<EntityType, EntityTypeConfig>;

/**
 * Entity type configurations
 */
export const ENTITY_TYPES: EntityTypesConfig = {
  person: {
    singular: 'person',
    plural: 'people',
    label: 'Person',
    labelPlural: 'People',
    icon: '👤',
    getCommand: 'get_person',
    updateCommand: 'update_person',
    createCommand: 'create_person',
    deleteCommand: 'delete_person',
    listCommand: 'list_people',
    paramKey: 'person_id',
    hasLocation: true,
    metadataFields: [
      { key: 'occupation', label: 'Occupation', type: 'text' },
      { key: 'birth_date', label: 'Birth', type: 'text' },
      { key: 'death_date', label: 'Death', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    formFields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { value: 'author', label: 'Author' },
          { value: 'historical_figure', label: 'Historical Figure' },
          { value: 'researcher', label: 'Researcher' },
          { value: 'owner', label: 'Owner' },
          { value: 'collector', label: 'Collector' },
        ],
        defaultValue: 'historical_figure',
      },
      { key: 'birth_year', label: 'Birth Year', type: 'number' },
      { key: 'death_year', label: 'Death Year', type: 'number' },
      { key: 'bio', label: 'Biography', type: 'textarea' },
      {
        key: 'relationship_type',
        label: 'Relationship',
        type: 'select',
        options: [
          { value: 'mentions', label: 'Mentions' },
          { value: 'authored_by', label: 'Authored By' },
          { value: 'about', label: 'About' },
        ],
        defaultValue: 'mentions',
      },
    ],
  },

  event: {
    singular: 'event',
    plural: 'events',
    label: 'Event',
    labelPlural: 'Events',
    icon: '📅',
    getCommand: 'get_event',
    updateCommand: 'update_event',
    createCommand: 'create_event',
    deleteCommand: 'delete_event',
    listCommand: 'list_events',
    paramKey: 'event_id',
    hasLocation: true,
    metadataFields: [
      { key: 'event_date', label: 'Date', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    formFields: [
      { key: 'name', label: 'Event Name', type: 'text', required: true },
      {
        key: 'event_type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'disaster', label: 'Disaster' },
          { value: 'discovery', label: 'Discovery' },
          { value: 'publication', label: 'Publication' },
          { value: 'battle', label: 'Battle' },
          { value: 'expedition', label: 'Expedition' },
        ],
        defaultValue: 'discovery',
      },
      { key: 'date_year', label: 'Year', type: 'number' },
      {
        key: 'date_precision',
        label: 'Precision',
        type: 'select',
        options: [
          { value: 'year', label: 'Year' },
          { value: 'month', label: 'Month' },
          { value: 'day', label: 'Day' },
        ],
        defaultValue: 'year',
      },
      { key: 'description', label: 'Description', type: 'textarea' },
      {
        key: 'relationship_type',
        label: 'Relationship',
        type: 'select',
        options: [
          { value: 'mentions', label: 'Mentions' },
          { value: 'describes', label: 'Describes' },
          { value: 'occurred_during', label: 'Occurred During' },
        ],
        defaultValue: 'mentions',
      },
    ],
  },

  theory: {
    singular: 'theory',
    plural: 'theories',
    label: 'Theory',
    labelPlural: 'Theories',
    icon: '💡',
    getCommand: 'get_theory',
    updateCommand: 'update_theory',
    createCommand: 'create_theory',
    deleteCommand: 'delete_theory',
    listCommand: 'list_theories',
    paramKey: 'theory_id',
    hasLocation: true,
    metadataFields: [{ key: 'description', label: 'Description', type: 'text' }],
    formFields: [
      { key: 'name', label: 'Theory Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'debunked', label: 'Debunked' },
          { value: 'proven', label: 'Proven' },
          { value: 'historical', label: 'Historical' },
        ],
        defaultValue: 'active',
      },
      {
        key: 'confidence_level',
        label: 'Confidence',
        type: 'select',
        options: [
          { value: 1, label: '1 Star' },
          { value: 2, label: '2 Stars' },
          { value: 3, label: '3 Stars' },
          { value: 4, label: '4 Stars' },
          { value: 5, label: '5 Stars' },
        ],
        defaultValue: 3,
      },
      {
        key: 'relationship_type',
        label: 'Relationship',
        type: 'select',
        options: [
          { value: 'supports', label: 'Supports' },
          { value: 'contradicts', label: 'Contradicts' },
          { value: 'mentions', label: 'Mentions' },
        ],
        defaultValue: 'supports',
      },
    ],
  },

  place: {
    singular: 'place',
    plural: 'places',
    label: 'Place',
    labelPlural: 'Places',
    icon: '📍',
    getCommand: 'get_place',
    updateCommand: 'update_place',
    createCommand: 'create_place',
    deleteCommand: 'delete_place',
    listCommand: 'list_places',
    paramKey: 'place_id',
    hasLocation: true,
    metadataFields: [
      { key: 'place_type', label: 'Type', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    formFields: [
      { key: 'name', label: 'Place Name', type: 'text', required: true },
      { key: 'lng', label: 'Longitude', type: 'number', step: 0.000001, defaultValue: 0 },
      { key: 'lat', label: 'Latitude', type: 'number', step: 0.000001, defaultValue: 0 },
      { key: 'note', label: 'Note', type: 'textarea' },
    ],
  },

  artifact: {
    singular: 'artifact',
    plural: 'artifacts',
    label: 'Artifact',
    labelPlural: 'Artifacts',
    icon: '🏺',
    getCommand: 'get_artifact',
    updateCommand: 'update_artifact',
    createCommand: 'create_artifact',
    deleteCommand: 'delete_artifact',
    listCommand: 'list_artifacts',
    paramKey: 'artifact_id',
    hasLocation: true,
    metadataFields: [
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'date_range', label: 'Date Range', type: 'text' },
      { key: 'owner_name', label: 'Owner', type: 'text' },
      { key: 'owner_type', label: 'Owner Type', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
    formFields: [
      { key: 'name', label: 'Artifact Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
};

/**
 * Get entity type configuration
 *
 * @param entityType - The entity type to get config for
 * @returns The configuration for the entity type
 * @throws Error if entity type is unknown
 */
export function getEntityTypeConfig(entityType: EntityType): EntityTypeConfig {
  const config = ENTITY_TYPES[entityType];
  if (!config) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  return config;
}

/**
 * Get all entity types as array
 *
 * @returns Array of all entity type strings
 */
export function getAllEntityTypes(): EntityType[] {
  return Object.keys(ENTITY_TYPES) as EntityType[];
}

/**
 * Create default entity for a given type
 *
 * @param entityType - The entity type to create defaults for
 * @returns Object with default values based on form field configuration
 */
export function createDefaultEntity(
  entityType: EntityType
): Record<string, string | number | null> {
  const config = getEntityTypeConfig(entityType);
  const entity: Record<string, string | number | null> = {};

  config.formFields.forEach((field) => {
    if (field.defaultValue !== undefined) {
      entity[field.key] = field.defaultValue;
    } else if (field.type === 'number') {
      entity[field.key] = null;
    } else if (field.type === 'textarea' || field.type === 'text') {
      entity[field.key] = '';
    }
  });

  return entity;
}
