/**
 * Tests for Entity Schemas
 *
 * Verifies that entity schemas properly accept null values for optional fields
 * as required by the Rust backend's serialization format.
 */

import { describe, it, expect } from 'vitest';
import {
  PersonSchema,
  EventSchema,
  TheorySchema,
  PlaceSchema,
  ArtifactSchema,
  CreatePersonInputSchema,
  CreateArtifactInputSchema,
} from './entities';

describe('PersonSchema', () => {
  const validPerson = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'John Doe',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid person with required fields only', () => {
    const result = PersonSchema.safeParse(validPerson);
    expect(result.success).toBe(true);
  });

  it('should accept null for all optional string fields', () => {
    const result = PersonSchema.safeParse({
      ...validPerson,
      description: null,
      metadata: null,
      birth_date: null,
      death_date: null,
      occupation: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept null for optional number fields (coordinates)', () => {
    const result = PersonSchema.safeParse({
      ...validPerson,
      lng: null,
      lat: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid values for optional fields', () => {
    const result = PersonSchema.safeParse({
      ...validPerson,
      description: 'A historical figure',
      birth_date: '1900-01-01',
      death_date: '1980-12-31',
      occupation: 'Archaeologist',
      lng: -74.006,
      lat: 40.7128,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.occupation).toBe('Archaeologist');
      expect(result.data.lng).toBe(-74.006);
    }
  });

  it('should reject invalid coordinate ranges', () => {
    const result = PersonSchema.safeParse({
      ...validPerson,
      lng: 200, // Invalid: > 180
    });
    expect(result.success).toBe(false);
  });
});

describe('EventSchema', () => {
  const validEvent = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Battle of Marathon',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept null for event-specific optional fields', () => {
    const result = EventSchema.safeParse({
      ...validEvent,
      event_date: null,
      location: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept string values for optional fields', () => {
    const result = EventSchema.safeParse({
      ...validEvent,
      event_date: '490 BC',
      location: 'Marathon, Greece',
    });
    expect(result.success).toBe(true);
  });
});

describe('TheorySchema', () => {
  const validTheory = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Migration Theory',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept theory with only base entity fields', () => {
    const result = TheorySchema.safeParse(validTheory);
    expect(result.success).toBe(true);
  });

  it('should accept null for base entity optional fields', () => {
    const result = TheorySchema.safeParse({
      ...validTheory,
      description: null,
      metadata: null,
      lng: null,
      lat: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('PlaceSchema', () => {
  const validPlace = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Athens',
    lng: 23.7275,
    lat: 37.9838,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid place with required coordinates', () => {
    const result = PlaceSchema.safeParse(validPlace);
    expect(result.success).toBe(true);
  });

  it('should reject place without coordinates', () => {
    const { lng, lat, ...placeWithoutCoords } = validPlace;
    const result = PlaceSchema.safeParse(placeWithoutCoords);
    expect(result.success).toBe(false);
  });

  it('should accept null for place_type', () => {
    const result = PlaceSchema.safeParse({
      ...validPlace,
      place_type: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept string for place_type', () => {
    const result = PlaceSchema.safeParse({
      ...validPlace,
      place_type: 'city',
    });
    expect(result.success).toBe(true);
  });
});

describe('ArtifactSchema', () => {
  const validArtifact = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Ancient Vase',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid artifact with minimal fields', () => {
    const result = ArtifactSchema.safeParse(validArtifact);
    expect(result.success).toBe(true);
  });

  it('should accept null for all artifact-specific optional fields', () => {
    const result = ArtifactSchema.safeParse({
      ...validArtifact,
      category: null,
      subcategory: null,
      period: null,
      estimated_age: null,
      date_found: null,
      date_range: null,
      findspot_place_id: null,
      findspot_description: null,
      findspot: null,
      excavation_notes: null,
      current_owner: null,
      current_location: null,
      owner_type: null,
      owner_name: null,
      accession_number: null,
      material: null,
      dimensions: null,
      weight: null,
      condition: null,
      notes: null,
      images: null,
      image_urls: null,
      has_disputed_ownership: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept array for image_urls', () => {
    const result = ArtifactSchema.safeParse({
      ...validArtifact,
      image_urls: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
    });
    expect(result.success).toBe(true);
  });

  it('should accept boolean for has_disputed_ownership', () => {
    const result = ArtifactSchema.safeParse({
      ...validArtifact,
      has_disputed_ownership: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL in image_urls array', () => {
    const result = ArtifactSchema.safeParse({
      ...validArtifact,
      image_urls: ['not a url'],
    });
    expect(result.success).toBe(false);
  });
});

describe('CreatePersonInputSchema', () => {
  const validInput = {
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Jane Doe',
  };

  it('should accept valid create input with required fields', () => {
    const result = CreatePersonInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept null for annotation_id and relationship_type', () => {
    const result = CreatePersonInputSchema.safeParse({
      ...validInput,
      annotation_id: null,
      relationship_type: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept undefined for annotation_id and relationship_type', () => {
    const result = CreatePersonInputSchema.safeParse({
      ...validInput,
      annotation_id: undefined,
      relationship_type: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid UUID for annotation_id', () => {
    const result = CreatePersonInputSchema.safeParse({
      ...validInput,
      annotation_id: '123e4567-e89b-12d3-a456-426614174000',
      relationship_type: 'mentions',
    });
    expect(result.success).toBe(true);
  });
});

describe('CreateArtifactInputSchema', () => {
  const validInput = {
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Bronze Helmet',
  };

  it('should accept null for all optional fields including annotation linking', () => {
    const result = CreateArtifactInputSchema.safeParse({
      ...validInput,
      annotation_id: null,
      relationship_type: null,
      category: null,
      subcategory: null,
      period: null,
      material: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid values for optional fields', () => {
    const result = CreateArtifactInputSchema.safeParse({
      ...validInput,
      category: 'weapon',
      material: 'bronze',
      period: 'Classical',
      annotation_id: '123e4567-e89b-12d3-a456-426614174000',
      relationship_type: 'depicts',
    });
    expect(result.success).toBe(true);
  });
});
