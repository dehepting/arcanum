/**
 * Tests for Annotation Schemas
 *
 * Verifies that annotation schemas properly accept null values for optional fields
 * as required by the Rust backend's serialization format.
 */

import { describe, it, expect } from 'vitest';
import {
  AnnotationSchema,
  AnnotationWithGeometrySchema,
  InkAnnotationSchema,
  CreateAnnotationInputSchema,
  UpdateAnnotationInputSchema,
  AnnotationWithLinksSchema,
  GeometrySchema,
} from './annotations';

describe('GeometrySchema', () => {
  it('should accept valid normalized geometry', () => {
    const result = GeometrySchema.safeParse({
      x: 0.5,
      y: 0.3,
      w: 0.2,
      h: 0.1,
    });
    expect(result.success).toBe(true);
  });

  it('should reject values outside 0-1 range', () => {
    const result = GeometrySchema.safeParse({
      x: 1.5,
      y: 0.3,
      w: 0.2,
      h: 0.1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative values', () => {
    const result = GeometrySchema.safeParse({
      x: -0.1,
      y: 0.3,
      w: 0.2,
      h: 0.1,
    });
    expect(result.success).toBe(false);
  });
});

describe('AnnotationSchema', () => {
  const validAnnotation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    source_id: '123e4567-e89b-12d3-a456-426614174001',
    project_id: '123e4567-e89b-12d3-a456-426614174002',
    annotation_type: 'highlight' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid annotation with required fields', () => {
    const result = AnnotationSchema.safeParse(validAnnotation);
    expect(result.success).toBe(true);
  });

  it('should accept null for all optional fields', () => {
    const result = AnnotationSchema.safeParse({
      ...validAnnotation,
      page_number: null,
      content: null,
      geometry: null,
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept undefined for optional fields', () => {
    const result = AnnotationSchema.safeParse({
      ...validAnnotation,
      page_number: undefined,
      content: undefined,
      geometry: undefined,
      metadata: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should accept page_number as integer', () => {
    const result = AnnotationSchema.safeParse({
      ...validAnnotation,
      page_number: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page_number).toBe(5);
    }
  });

  it('should accept content as string', () => {
    const result = AnnotationSchema.safeParse({
      ...validAnnotation,
      content: 'This is important text',
    });
    expect(result.success).toBe(true);
  });

  it('should accept geometry as JSON string', () => {
    const result = AnnotationSchema.safeParse({
      ...validAnnotation,
      geometry: JSON.stringify({ x: 0.5, y: 0.3, w: 0.2, h: 0.1 }),
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative page_number', () => {
    const result = AnnotationSchema.safeParse({
      ...validAnnotation,
      page_number: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid annotation types', () => {
    const types = ['highlight', 'text', 'ink'] as const;
    types.forEach((type) => {
      const result = AnnotationSchema.safeParse({
        ...validAnnotation,
        annotation_type: type,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid annotation type', () => {
    const result = AnnotationSchema.safeParse({
      ...validAnnotation,
      annotation_type: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('AnnotationWithGeometrySchema', () => {
  const validAnnotationWithGeometry = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    source_id: '123e4567-e89b-12d3-a456-426614174001',
    project_id: '123e4567-e89b-12d3-a456-426614174002',
    annotation_type: 'highlight' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept null for parsed geometry', () => {
    const result = AnnotationWithGeometrySchema.safeParse({
      ...validAnnotationWithGeometry,
      geometry: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept undefined for parsed geometry', () => {
    const result = AnnotationWithGeometrySchema.safeParse({
      ...validAnnotationWithGeometry,
      geometry: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should accept geometry object', () => {
    const result = AnnotationWithGeometrySchema.safeParse({
      ...validAnnotationWithGeometry,
      geometry: { x: 0.5, y: 0.3, w: 0.2, h: 0.1 },
    });
    expect(result.success).toBe(true);
  });
});

describe('InkAnnotationSchema', () => {
  const validInkAnnotation = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    source_id: '123e4567-e89b-12d3-a456-426614174001',
    project_id: '123e4567-e89b-12d3-a456-426614174002',
    annotation_type: 'ink' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept null for geometry and metadata', () => {
    const result = InkAnnotationSchema.safeParse({
      ...validInkAnnotation,
      geometry: null,
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept ink metadata with ink_data', () => {
    const result = InkAnnotationSchema.safeParse({
      ...validInkAnnotation,
      metadata: {
        ink_data: '{"objects":[]}',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should enforce annotation_type to be "ink"', () => {
    const result = InkAnnotationSchema.safeParse({
      ...validInkAnnotation,
      annotation_type: 'highlight',
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateAnnotationInputSchema', () => {
  const validInput = {
    source_id: '123e4567-e89b-12d3-a456-426614174001',
    project_id: '123e4567-e89b-12d3-a456-426614174002',
    annotation_type: 'highlight' as const,
  };

  it('should accept valid create input with required fields', () => {
    const result = CreateAnnotationInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept null for all optional fields', () => {
    const result = CreateAnnotationInputSchema.safeParse({
      ...validInput,
      page_number: null,
      content: null,
      geometry: null,
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept geometry as object', () => {
    const result = CreateAnnotationInputSchema.safeParse({
      ...validInput,
      geometry: { x: 0.5, y: 0.3, w: 0.2, h: 0.1 },
    });
    expect(result.success).toBe(true);
  });

  it('should accept geometry as JSON string', () => {
    const result = CreateAnnotationInputSchema.safeParse({
      ...validInput,
      geometry: JSON.stringify({ x: 0.5, y: 0.3, w: 0.2, h: 0.1 }),
    });
    expect(result.success).toBe(true);
  });

  it('should accept metadata as object', () => {
    const result = CreateAnnotationInputSchema.safeParse({
      ...validInput,
      metadata: { ink_data: '{"objects":[]}' },
    });
    expect(result.success).toBe(true);
  });

  it('should accept metadata as JSON string', () => {
    const result = CreateAnnotationInputSchema.safeParse({
      ...validInput,
      metadata: JSON.stringify({ ink_data: '{"objects":[]}' }),
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateAnnotationInputSchema', () => {
  it('should accept null for all fields', () => {
    const result = UpdateAnnotationInputSchema.safeParse({
      content: null,
      geometry: null,
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty object', () => {
    const result = UpdateAnnotationInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept partial updates', () => {
    const result = UpdateAnnotationInputSchema.safeParse({
      content: 'Updated text',
    });
    expect(result.success).toBe(true);
  });

  it('should accept geometry as object or string', () => {
    const resultObj = UpdateAnnotationInputSchema.safeParse({
      geometry: { x: 0.5, y: 0.3, w: 0.2, h: 0.1 },
    });
    expect(resultObj.success).toBe(true);

    const resultStr = UpdateAnnotationInputSchema.safeParse({
      geometry: JSON.stringify({ x: 0.5, y: 0.3, w: 0.2, h: 0.1 }),
    });
    expect(resultStr.success).toBe(true);
  });
});

describe('AnnotationWithLinksSchema', () => {
  const validAnnotationWithLinks = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    source_id: '123e4567-e89b-12d3-a456-426614174001',
    project_id: '123e4567-e89b-12d3-a456-426614174002',
    annotation_type: 'highlight' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept null for all link arrays', () => {
    const result = AnnotationWithLinksSchema.safeParse({
      ...validAnnotationWithLinks,
      linkedPeople: null,
      linkedEvents: null,
      linkedTheories: null,
      linkedPlaces: null,
      linkedArtifacts: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept undefined for all link arrays', () => {
    const result = AnnotationWithLinksSchema.safeParse({
      ...validAnnotationWithLinks,
      linkedPeople: undefined,
      linkedEvents: undefined,
      linkedTheories: undefined,
      linkedPlaces: undefined,
      linkedArtifacts: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should accept arrays of UUIDs for link fields', () => {
    const result = AnnotationWithLinksSchema.safeParse({
      ...validAnnotationWithLinks,
      linkedPeople: ['123e4567-e89b-12d3-a456-426614174000'],
      linkedEvents: ['123e4567-e89b-12d3-a456-426614174001'],
      linkedTheories: [],
      linkedPlaces: null,
      linkedArtifacts: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUIDs in link arrays', () => {
    const result = AnnotationWithLinksSchema.safeParse({
      ...validAnnotationWithLinks,
      linkedPeople: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });
});
