/**
 * Test file for entity pages functionality
 * Run with: npm test src/lib/entityPages.test.js
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createEntityPage,
  getEntityPage,
  updateEntityPage,
  deleteEntityPage,
  searchEntityPages,
  createEntityLink,
  getEntityLinks,
} from './entityPages';

// Test data
const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_ENTITY_ID = '00000000-0000-0000-0000-000000000002';

describe('Entity Pages', () => {
  it.skip('should create an entity page', async () => {
    const { data, error } = await createEntityPage(
      TEST_PROJECT_ID,
      TEST_ENTITY_ID,
      'person',
      'Aristotle',
      '# Aristotle\n\nGreek philosopher (384-322 BC)',
      { tags: ['philosophy', 'ancient greece'] }
    );

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.title).toBe('Aristotle');
    expect(data.entity_type).toBe('person');
  });

  it.skip('should get an entity page', async () => {
    const { data, error } = await getEntityPage(TEST_ENTITY_ID);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.page).toBeDefined();
    expect(data.content).toContain('Aristotle');
  });

  it.skip('should update entity page content', async () => {
    const { data, error } = await updateEntityPage(
      TEST_ENTITY_ID,
      '\n\n## Works\n\n- Metaphysics\n- Ethics',
      true // append
    );

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it.skip('should search entity pages', async () => {
    const { data, error } = await searchEntityPages(TEST_PROJECT_ID, 'Aristotle', ['person']);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it.skip('should create entity link', async () => {
    const THEORY_ID = '00000000-0000-0000-0000-000000000003';

    const { data, error } = await createEntityLink(
      TEST_PROJECT_ID,
      TEST_ENTITY_ID,
      'person',
      THEORY_ID,
      'theory',
      'authored',
      true,
      'Aristotle wrote about Atlantis'
    );

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.relationship_type).toBe('authored');
  });

  it.skip('should get entity links', async () => {
    const { data, error } = await getEntityLinks(TEST_ENTITY_ID);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.outgoing).toBeDefined();
    expect(data.incoming).toBeDefined();
  });

  it.skip('should delete an entity page', async () => {
    const { data, error } = await deleteEntityPage(TEST_ENTITY_ID);

    expect(error).toBeNull();
    expect(data).toBe(true);
  });
});

describe('Entity Pages - Edge Cases', () => {
  it.skip('should handle non-existent entity', async () => {
    const FAKE_ID = '00000000-0000-0000-0000-999999999999';
    const { data, error } = await getEntityPage(FAKE_ID);

    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  it.skip('should prevent duplicate entity pages', async () => {
    // Try to create same entity page twice
    const { error } = await createEntityPage(
      TEST_PROJECT_ID,
      TEST_ENTITY_ID,
      'person',
      'Duplicate Test',
      'Content'
    );

    // Should fail due to unique constraint
    expect(error).toBeDefined();
  });
});
