/**
 * Project Integration Tests
 *
 * Tests that validate Project operations work correctly with real backend.
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, afterAll } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { testData } from '../../../tests/integration-utils';
import type { Project } from '../../types/store';

describe('Project Integration Tests', () => {
  afterAll(async () => {
    await testData.cleanup();
  });

  describe('Project CRUD Operations', () => {
    it('should create a project', async () => {
      const project = await invoke<Project>('create_project', {
        input: {
          name: 'Test Project',
          description: 'A test project for integration testing',
        },
      });

      testData.trackProject(project.id);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('A test project for integration testing');
      expect(project.created_at).toBeDefined();
      expect(project.updated_at).toBeDefined();
    });

    it('should list projects', async () => {
      // Create a test project
      const created = await invoke<Project>('create_project', {
        input: { name: 'List Test Project' },
      });
      testData.trackProject(created.id);

      // List all projects
      const projects = await invoke<Project[]>('list_projects');

      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThan(0);

      // Should include our test project
      const found = projects.find((p) => p.id === created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('List Test Project');
    });

    it('should update a project', async () => {
      // Create a project
      const project = await invoke<Project>('create_project', {
        input: { name: 'Original Name' },
      });
      testData.trackProject(project.id);

      // Update it
      const updated = await invoke<Project>('update_project', {
        projectId: project.id,
        input: {
          name: 'Updated Name',
          description: 'Updated description',
        },
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
    });

    it('should delete a project', async () => {
      // Create a project
      const project = await invoke<Project>('create_project', {
        input: { name: 'To Be Deleted' },
      });

      // Delete it
      await invoke('delete_project', {
        projectId: project.id,
      });

      // Try to list projects - deleted one should not be there
      const projects = await invoke<Project[]>('list_projects');
      const found = projects.find((p) => p.id === project.id);
      expect(found).toBeUndefined();
    });
  });

  describe('Project Schema Validation', () => {
    it('should have correct Project structure', async () => {
      const project = await invoke<Project>('create_project', {
        input: { name: 'Schema Test' },
      });
      testData.trackProject(project.id);

      // Validate structure
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('created_at');
      expect(project).toHaveProperty('updated_at');

      // Optional field
      expect(project).toHaveProperty('description');
    });
  });
});
