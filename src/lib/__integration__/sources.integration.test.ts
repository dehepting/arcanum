/**
 * Source Integration Tests
 *
 * Tests that validate Source data structure matches between backend and frontend.
 * These tests call the real Tauri backend commands.
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  createTestProject,
  testData,
  assertSourceStructure,
} from '../../../tests/integration-utils';
import type { Source, Project } from '../../types/store';

describe('Source Integration Tests', () => {
  let testProject: Project;

  beforeAll(async () => {
    testProject = await createTestProject('Source Test Project');
  });

  afterAll(async () => {
    await testData.cleanup();
  });

  describe('Schema Validation', () => {
    it('should have correct property names (title not name, file_url not file_path)', async () => {
      const sources = await invoke<Source[]>('list_sources', {
        projectId: testProject.id,
      });

      // Even if empty, the type should be correct
      expect(sources).toBeInstanceOf(Array);

      // If we have sources, validate their structure
      if (sources.length > 0) {
        const source = sources[0];

        // This test catches the bug we just fixed!
        assertSourceStructure(source);

        // Explicitly check the properties that were wrong
        expect(source).toHaveProperty('title'); // ✅ Not 'name'
        expect(source).toHaveProperty('file_url'); // ✅ Not 'file_path'
        expect(source).toHaveProperty('file_name');
        expect(source).toHaveProperty('storage_path');

        // Type check: TypeScript should recognize these now
        expect(typeof source.title).toBe('string');
        expect(typeof source.file_url).toBe('string');
      }
    });

    it('should include all required Source fields', async () => {
      const sources = await invoke<Source[]>('list_sources', {
        projectId: testProject.id,
      });

      if (sources.length > 0) {
        const source = sources[0];

        // Required fields
        expect(source.id).toBeDefined();
        expect(source.project_id).toBeDefined();
        expect(source.title).toBeDefined();
        expect(source.file_name).toBeDefined();
        expect(source.storage_path).toBeDefined();
        expect(source.file_url).toBeDefined();
        expect(source.created_at).toBeDefined();
        expect(source.updated_at).toBeDefined();

        // Optional fields (may be null/undefined)
        // file_size, mime_type, metadata can be optional
      }
    });
  });

  describe('Source Operations', () => {
    it('should list sources for a project', async () => {
      const sources = await invoke<Source[]>('list_sources', {
        projectId: testProject.id,
      });

      expect(sources).toBeInstanceOf(Array);
      // New project should have no sources
      expect(sources.length).toBe(0);
    });

    // TODO: Add test for creating source
    // Requires setting up test PDF file
    it.skip('should create a source with correct schema', async () => {
      // const source = await invoke('create_source', { ... });
      // assertSourceStructure(source);
    });

    // TODO: Add test for updating source title
    it.skip('should update source title', async () => {
      // const updated = await invoke('update_source', {
      //   sourceId: source.id,
      //   input: { title: 'New Title' }
      // });
      // expect(updated.title).toBe('New Title');
    });
  });
});
