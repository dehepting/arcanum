/**
 * Integration Test Utilities
 *
 * Helpers for writing integration tests that interact with the real backend.
 */

import { invoke } from '@tauri-apps/api/core';
import type { Project } from '../src/types/store';

/**
 * Test data cleanup tracker
 * Tracks created resources to clean up after tests
 */
class TestDataTracker {
  private projects: string[] = [];
  private sources: string[] = [];
  private entities: Map<string, string[]> = new Map();

  trackProject(id: string) {
    this.projects.push(id);
  }

  trackSource(id: string) {
    this.sources.push(id);
  }

  trackEntity(type: string, id: string) {
    if (!this.entities.has(type)) {
      this.entities.set(type, []);
    }
    this.entities.get(type)!.push(id);
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');

    // Delete sources
    for (const id of this.sources) {
      try {
        await invoke('delete_source', { sourceId: id });
      } catch (err) {
        console.warn(`Failed to delete source ${id}:`, err);
      }
    }

    // Delete projects (this cascades to most other data)
    for (const id of this.projects) {
      try {
        await invoke('delete_project', { projectId: id });
      } catch (err) {
        console.warn(`Failed to delete project ${id}:`, err);
      }
    }

    // Reset tracker
    this.projects = [];
    this.sources = [];
    this.entities.clear();
  }
}

export const testData = new TestDataTracker();

/**
 * Create a test project
 * Automatically tracked for cleanup
 */
export async function createTestProject(
  name = 'Test Project',
  description = 'Integration test project'
): Promise<Project> {
  const project = await invoke<Project>('create_project', {
    input: { name, description },
  });
  testData.trackProject(project.id);
  return project;
}

/**
 * Create a test source (PDF)
 * Requires a valid file path for integration tests
 */
export async function createTestSource(
  projectId: string,
  title = 'Test Source',
  filePath?: string
): Promise<any> {
  // For integration tests, you'd need a real test PDF file
  // For now, this is a placeholder
  const source = await invoke('create_source', {
    input: {
      project_id: projectId,
      title,
      file_name: 'test.pdf',
      storage_path: filePath || '/tmp/test.pdf',
      file_url: filePath || '/tmp/test.pdf',
    },
  });
  testData.trackSource(source.id);
  return source;
}

/**
 * Wait for async operations to complete
 * Useful for waiting for backend processing
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Assert that an object matches a schema structure
 * Simple structural validation without Zod
 */
export function assertStructure<T extends Record<string, any>>(
  obj: any,
  expectedKeys: (keyof T)[],
  objName = 'object'
): asserts obj is T {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`${objName} is not an object`);
  }

  for (const key of expectedKeys) {
    if (!(key in obj)) {
      throw new Error(
        `${objName} is missing required property: ${String(key)}\nGot: ${JSON.stringify(Object.keys(obj))}`
      );
    }
  }
}

/**
 * Assert that data matches Source interface
 */
export function assertSourceStructure(source: any): void {
  assertStructure(
    source,
    [
      'id',
      'project_id',
      'title', // Not 'name'!
      'file_url', // Not 'file_path'!
      'file_name',
      'storage_path',
      'created_at',
      'updated_at',
    ],
    'Source'
  );
}
