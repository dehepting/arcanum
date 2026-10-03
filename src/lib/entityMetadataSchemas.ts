/**
 * Metadata field schemas for each entity type
 * Defines what fields to show, their types, validation, and grouping
 */

import type { EntityType } from '@/types';

/**
 * Field type for metadata schemas
 */
export type MetadataFieldType = 'text' | 'date' | 'number' | 'select';

/**
 * Select option for metadata fields
 */
export interface MetadataSelectOption {
  value: string;
  label: string;
}

/**
 * Validation function type
 */
export type ValidationFunction = (value: string | number | null) => string | null;

/**
 * Metadata field schema
 */
export interface MetadataFieldSchema {
  key: string;
  label: string;
  type: MetadataFieldType;
  icon?: string;
  placeholder?: string;
  multiline?: boolean;
  validation?: ValidationFunction;
  clearable?: boolean;
  options?: MetadataSelectOption[];
}

/**
 * Metadata field group
 */
export interface MetadataFieldGroup {
  title: string;
  icon: string;
  fields: MetadataFieldSchema[];
}

/**
 * Entity metadata schema
 */
export interface EntityMetadataSchema {
  groups: MetadataFieldGroup[];
}

/**
 * All entity metadata schemas
 */
export type EntityMetadataSchemas = Record<EntityType, EntityMetadataSchema>;

// Validation functions
const validateDate: ValidationFunction = (value) => {
  if (!value) return null;
  const date = new Date(value as string);
  if (isNaN(date.getTime())) {
    return 'Invalid date format';
  }
  return null;
};

const validateLatitude: ValidationFunction = (value) => {
  if (value === '' || value === null) return null;
  const num = parseFloat(value as string);
  if (isNaN(num)) return 'Must be a number';
  if (num < -90 || num > 90) return 'Latitude must be between -90 and 90';
  return null;
};

const validateLongitude: ValidationFunction = (value) => {
  if (value === '' || value === null) return null;
  const num = parseFloat(value as string);
  if (isNaN(num)) return 'Must be a number';
  if (num < -180 || num > 180) return 'Longitude must be between -180 and 180';
  return null;
};

export const entityMetadataSchemas: EntityMetadataSchemas = {
  person: {
    groups: [
      {
        title: 'Basic Information',
        icon: '👤',
        fields: [
          {
            key: 'occupation',
            label: 'Occupation',
            type: 'text',
            icon: '💼',
            placeholder: 'e.g., Archaeologist, Professor',
          },
          {
            key: 'description',
            label: 'Description',
            type: 'text',
            icon: '📝',
            multiline: true,
            placeholder: 'Brief description of this person',
          },
        ],
      },
      {
        title: 'Dates',
        icon: '📅',
        fields: [
          {
            key: 'birth_date',
            label: 'Birth Date',
            type: 'date',
            icon: '🎂',
            validation: validateDate,
            clearable: true,
          },
          {
            key: 'death_date',
            label: 'Death Date',
            type: 'date',
            icon: '🕊️',
            validation: validateDate,
            clearable: true,
          },
        ],
      },
      {
        title: 'Location',
        icon: '📍',
        fields: [
          {
            key: 'lat',
            label: 'Latitude',
            type: 'number',
            icon: '🌐',
            validation: validateLatitude,
            placeholder: 'e.g., 40.7128',
            clearable: true,
          },
          {
            key: 'lng',
            label: 'Longitude',
            type: 'number',
            icon: '🌐',
            validation: validateLongitude,
            placeholder: 'e.g., -74.0060',
            clearable: true,
          },
        ],
      },
    ],
  },

  event: {
    groups: [
      {
        title: 'Basic Information',
        icon: '📅',
        fields: [
          {
            key: 'event_date',
            label: 'Date',
            type: 'date',
            icon: '📆',
            validation: validateDate,
            clearable: true,
          },
          {
            key: 'location',
            label: 'Location Name',
            type: 'text',
            icon: '📍',
            placeholder: 'e.g., Athens, Greece',
          },
          {
            key: 'description',
            label: 'Description',
            type: 'text',
            icon: '📝',
            multiline: true,
            placeholder: 'Brief description of this event',
          },
        ],
      },
      {
        title: 'Coordinates',
        icon: '🗺️',
        fields: [
          {
            key: 'lat',
            label: 'Latitude',
            type: 'number',
            icon: '🌐',
            validation: validateLatitude,
            placeholder: 'e.g., 40.7128',
            clearable: true,
          },
          {
            key: 'lng',
            label: 'Longitude',
            type: 'number',
            icon: '🌐',
            validation: validateLongitude,
            placeholder: 'e.g., -74.0060',
            clearable: true,
          },
        ],
      },
    ],
  },

  place: {
    groups: [
      {
        title: 'Basic Information',
        icon: '📍',
        fields: [
          {
            key: 'place_type',
            label: 'Type',
            type: 'select',
            icon: '🏛️',
            options: [
              { value: 'city', label: 'City' },
              { value: 'site', label: 'Archaeological Site' },
              { value: 'monument', label: 'Monument' },
              { value: 'region', label: 'Region' },
              { value: 'landmark', label: 'Landmark' },
              { value: 'other', label: 'Other' },
            ],
          },
          {
            key: 'description',
            label: 'Description',
            type: 'text',
            icon: '📝',
            multiline: true,
            placeholder: 'Brief description of this place',
          },
        ],
      },
      {
        title: 'Coordinates',
        icon: '🗺️',
        fields: [
          {
            key: 'lat',
            label: 'Latitude',
            type: 'number',
            icon: '🌐',
            validation: validateLatitude,
            placeholder: 'e.g., 40.7128',
            clearable: true,
          },
          {
            key: 'lng',
            label: 'Longitude',
            type: 'number',
            icon: '🌐',
            validation: validateLongitude,
            placeholder: 'e.g., -74.0060',
            clearable: true,
          },
        ],
      },
    ],
  },

  artifact: {
    groups: [
      {
        title: 'Basic Information',
        icon: '🏺',
        fields: [
          {
            key: 'category',
            label: 'Category',
            type: 'select',
            icon: '📦',
            options: [
              { value: 'pottery', label: 'Pottery' },
              { value: 'sculpture', label: 'Sculpture' },
              { value: 'jewelry', label: 'Jewelry' },
              { value: 'weapon', label: 'Weapon' },
              { value: 'tool', label: 'Tool' },
              { value: 'coin', label: 'Coin' },
              { value: 'textile', label: 'Textile' },
              { value: 'inscription', label: 'Inscription' },
              { value: 'architecture', label: 'Architecture' },
              { value: 'other', label: 'Other' },
            ],
          },
          {
            key: 'date_range',
            label: 'Date Range',
            type: 'text',
            icon: '📅',
            placeholder: 'e.g., 500-400 BCE',
          },
          {
            key: 'description',
            label: 'Description',
            type: 'text',
            icon: '📝',
            multiline: true,
            placeholder: 'Brief description of this artifact',
          },
        ],
      },
      {
        title: 'Ownership',
        icon: '👥',
        fields: [
          {
            key: 'owner_name',
            label: 'Owner',
            type: 'text',
            icon: '👤',
            placeholder: 'e.g., British Museum',
          },
          {
            key: 'owner_type',
            label: 'Owner Type',
            type: 'select',
            icon: '🏛️',
            options: [
              { value: 'museum', label: 'Museum' },
              { value: 'private', label: 'Private Collection' },
              { value: 'institution', label: 'Institution' },
              { value: 'government', label: 'Government' },
              { value: 'other', label: 'Other' },
            ],
          },
        ],
      },
      {
        title: 'Location',
        icon: '📍',
        fields: [
          {
            key: 'lat',
            label: 'Latitude',
            type: 'number',
            icon: '🌐',
            validation: validateLatitude,
            placeholder: 'e.g., 40.7128',
            clearable: true,
          },
          {
            key: 'lng',
            label: 'Longitude',
            type: 'number',
            icon: '🌐',
            validation: validateLongitude,
            placeholder: 'e.g., -74.0060',
            clearable: true,
          },
        ],
      },
    ],
  },

  theory: {
    groups: [
      {
        title: 'Basic Information',
        icon: '💡',
        fields: [
          {
            key: 'description',
            label: 'Description',
            type: 'text',
            icon: '📝',
            multiline: true,
            placeholder: 'Brief description of this theory',
          },
        ],
      },
      {
        title: 'Location',
        icon: '📍',
        fields: [
          {
            key: 'lat',
            label: 'Latitude',
            type: 'number',
            icon: '🌐',
            validation: validateLatitude,
            placeholder: 'e.g., 40.7128',
            clearable: true,
          },
          {
            key: 'lng',
            label: 'Longitude',
            type: 'number',
            icon: '🌐',
            validation: validateLongitude,
            placeholder: 'e.g., -74.0060',
            clearable: true,
          },
        ],
      },
    ],
  },
};
