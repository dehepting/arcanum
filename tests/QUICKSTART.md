# Integration Testing Quick Start

## 🎯 Goal

Catch bugs like the **Source type mismatch** (name vs title, file_path vs file_url) before they reach production.

## 🚀 Quick Example

Here's how integration tests would have caught the bug:

```typescript
// This test FAILS if TypeScript types don't match backend
it('should have correct Source properties', async () => {
  const sources = await invoke<Source[]>('list_sources', { projectId });

  if (sources.length > 0) {
    const source = sources[0];

    // ✅ PASSES if backend returns 'title' and type expects 'title'
    // ❌ FAILS if backend returns 'title' but type expects 'name'
    expect(source.title).toBeDefined();

    // ✅ PASSES if backend returns 'file_url' and type expects 'file_url'
    // ❌ FAILS if backend returns 'file_url' but type expects 'file_path'
    expect(source.file_url).toBeDefined();
  }
});
```

## 📝 Writing Your First Integration Test

### Step 1: Create the test file

```bash
# Create a new integration test
touch src/lib/__integration__/my-feature.integration.test.ts
```

### Step 2: Copy this template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { createTestProject, testData } from '../../../tests/integration-utils';

describe('My Feature Integration Tests', () => {
  let projectId: string;

  // Setup: Create test data
  beforeAll(async () => {
    const project = await createTestProject();
    projectId = project.id;
  });

  // Cleanup: Delete test data
  afterAll(async () => {
    await testData.cleanup();
  });

  // Write your test
  it('should do something', async () => {
    const result = await invoke('my_command', { projectId });
    expect(result).toBeDefined();
  });
});
```

### Step 3: Run it

```bash
npm run test:integration
```

## 🎓 Learn by Example

Look at existing integration tests:

1. **`src/lib/__integration__/projects.integration.test.ts`**
   - Shows CRUD operations
   - Demonstrates cleanup

2. **`src/lib/__integration__/sources.integration.test.ts`**
   - Shows schema validation
   - Catches type mismatches

## 🧰 Common Patterns

### Pattern 1: Validate Data Structure

```typescript
it('should return correct schema', async () => {
  const data = await invoke('get_something', { id: '123' });

  // Check all required fields exist
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('name');
  expect(data).toHaveProperty('created_at');
});
```

### Pattern 2: Test Full Workflow

```typescript
it('should create and retrieve entity', async () => {
  // Create
  const created = await invoke('create_entity', {
    input: { name: 'Test' },
  });
  testData.trackEntity('entity', created.id);

  // Retrieve
  const retrieved = await invoke('get_entity', {
    entityId: created.id,
  });

  expect(retrieved.name).toBe('Test');
});
```

### Pattern 3: Validate Relationships

```typescript
it('should link entities correctly', async () => {
  const person = await invoke('create_person', { input: { name: 'Alice' } });
  const event = await invoke('create_event', { input: { name: 'Meeting' } });

  await invoke('link_person_to_event', {
    personId: person.id,
    eventId: event.id,
  });

  const links = await invoke('get_person_events', { personId: person.id });
  expect(links).toHaveLength(1);
  expect(links[0].event_id).toBe(event.id);
});
```

## ⚡ Pro Tips

1. **Always clean up**: Use `testData.cleanup()` in `afterAll`
2. **Use helpers**: Don't create projects manually, use `createTestProject()`
3. **Test the contract**: Focus on data shape, not implementation
4. **One assertion per test**: Makes failures easier to debug
5. **Descriptive names**: "should validate Source has title property" > "test source"

## 🐛 Debugging Failed Tests

```bash
# Run with verbose output
npm run test:integration -- --reporter=verbose

# Run specific test file
npm run test:integration -- sources.integration

# Run single test
npm run test:integration -- -t "should have correct property names"
```

## 📚 Next Steps

1. Read `tests/README.md` for full documentation
2. Look at existing tests for patterns
3. Write integration tests for new features
4. Run `npm run test:all` before committing
