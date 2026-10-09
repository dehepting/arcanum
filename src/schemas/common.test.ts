/**
 * Tests for Common Schemas
 *
 * Verifies that schemas properly accept null values for optional fields
 * as required by the Rust backend's serialization format.
 */

import { describe, it, expect } from 'vitest';
import { ProjectSchema, SourceSchema, MapOverlaySchema } from './common';

describe('ProjectSchema', () => {
  const validProject = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid project with all required fields', () => {
    const result = ProjectSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('should accept null for optional description field', () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      description: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe(null);
    }
  });

  it('should accept undefined for optional description field', () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      description: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should accept string for optional description field', () => {
    const result = ProjectSchema.safeParse({
      ...validProject,
      description: 'A test project',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('A test project');
    }
  });

  it('should reject missing required fields', () => {
    const result = ProjectSchema.safeParse({
      name: 'Test Project',
    });
    expect(result.success).toBe(false);
  });
});

describe('SourceSchema', () => {
  const validSource = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Test PDF',
    file_name: 'test.pdf',
    storage_path: 'project/test.pdf',
    file_url: '/path/to/test.pdf',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid source with all required fields', () => {
    const result = SourceSchema.safeParse(validSource);
    expect(result.success).toBe(true);
  });

  it('should accept null for optional file_size field', () => {
    const result = SourceSchema.safeParse({
      ...validSource,
      file_size: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.file_size).toBe(null);
    }
  });

  it('should accept null for optional mime_type field', () => {
    const result = SourceSchema.safeParse({
      ...validSource,
      mime_type: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept null for optional metadata field', () => {
    const result = SourceSchema.safeParse({
      ...validSource,
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept all optional fields as null simultaneously', () => {
    const result = SourceSchema.safeParse({
      ...validSource,
      file_size: null,
      mime_type: null,
      metadata: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept number for file_size', () => {
    const result = SourceSchema.safeParse({
      ...validSource,
      file_size: 1024,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.file_size).toBe(1024);
    }
  });

  it('should reject negative file_size', () => {
    const result = SourceSchema.safeParse({
      ...validSource,
      file_size: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('MapOverlaySchema', () => {
  const validOverlay = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    project_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Overlay',
    image_path: '/path/to/image.png',
    bounds: [
      [40.7128, -74.006],
      [40.7589, -73.9851],
    ] as [[number, number], [number, number]],
    opacity: 0.5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should accept valid map overlay', () => {
    const result = MapOverlaySchema.safeParse(validOverlay);
    expect(result.success).toBe(true);
  });

  it('should validate opacity range (0-1)', () => {
    const result = MapOverlaySchema.safeParse({
      ...validOverlay,
      opacity: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('should validate bounds structure', () => {
    const result = MapOverlaySchema.safeParse({
      ...validOverlay,
      bounds: [[40.7128, -74.006]], // Missing second coordinate pair
    });
    expect(result.success).toBe(false);
  });
});
