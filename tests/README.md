# Testing Guide

## Overview

Arcanum uses a **layered testing approach** to ensure code quality:

1. **Unit Tests** - Fast, isolated component tests
2. **Integration Tests** - Test backend + frontend interaction
3. **CI/CD** - Automated testing on every commit

## Test Types

### Unit Tests (464 tests)

**What they test**: Individual components in isolation with mocked data

**Where**: `src/**/*.test.{ts,tsx,js,jsx}`

**Run**: `npm test`

**Speed**: Fast (~5 seconds)

**Use for**:
- Component rendering
- User interactions (clicks, inputs)
- State management logic
- Pure functions

**Example**:
```typescript
// src/components/Button.test.tsx
it('should call onClick when clicked', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(onClick).toHaveBeenCalled();
});
```

### Integration Tests

**What they test**: Real backend + frontend interaction

**Where**: `src/**/*.integration.test.ts`

**Run**: `npm run test:integration`

**Speed**: Slower (~10-30 seconds)

**Use for**:
- Validating TypeScript types match backend schema
- Testing full data flow (frontend → Rust → database → frontend)
- Catching type mismatches (like the Source name/title bug)

**Example**:
```typescript
// src/lib/__integration__/sources.integration.test.ts
it('should have correct property names', async () => {
  const sources = await invoke<Source[]>('list_sources', { projectId });

  // This catches type mismatches!
  expect(sources[0]).toHaveProperty('title'); // Not 'name'
  expect(sources[0]).toHaveProperty('file_url'); // Not 'file_path'
});
```

## Running Tests

```bash
# Unit tests only (fast feedback during development)
npm test

# Integration tests only (validate backend contracts)
npm run test:integration

# All tests (run before committing)
npm run test:all

# Type checking
npm run type-check

# Full quality check
npm run lint:all && npm run test:all
```

## CI/CD Pipeline

Every push/PR triggers:

1. **Unit Tests** (2-5 min)
   - Runs all unit tests
   - Type checking
   - Linting
   - ❌ If fails → Integration tests don't run (save CI time)

2. **Integration Tests** (5-10 min)
   - Builds Rust backend
   - Runs integration tests
   - Only runs if unit tests pass

3. **Build Check** (5-10 min)
   - Validates production build works
   - Runs in parallel with integration tests

**Total CI time**: ~10-15 minutes

## Adding New Tests

### Adding a Unit Test

1. Create `MyComponent.test.tsx` next to `MyComponent.tsx`
2. Write test using Vitest + React Testing Library
3. Run `npm test` to verify

```typescript
// src/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Adding an Integration Test

1. Create `feature.integration.test.ts` in `src/lib/__integration__/`
2. Use helper functions from `tests/integration-utils.ts`
3. Always clean up test data in `afterAll`
4. Run `npm run test:integration` to verify

```typescript
// src/lib/__integration__/annotations.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { createTestProject, testData } from '../../../tests/integration-utils';

describe('Annotation Integration Tests', () => {
  let projectId: string;

  beforeAll(async () => {
    const project = await createTestProject();
    projectId = project.id;
  });

  afterAll(async () => {
    await testData.cleanup(); // IMPORTANT: Clean up test data
  });

  it('should create an annotation', async () => {
    const annotation = await invoke('create_annotation', {
      input: {
        source_id: 'test-source',
        page_number: 1,
        annotation_type: 'highlight',
        // ... more fields
      },
    });

    expect(annotation).toBeDefined();
    expect(annotation.annotation_type).toBe('highlight');
  });
});
```

### Best Practices

✅ **DO**:
- Use integration tests to validate TypeScript types match backend
- Clean up test data in `afterAll`
- Use `createTestProject()` helper to create test projects
- Track created resources with `testData.track*()`
- Use descriptive test names
- Test one thing per test

❌ **DON'T**:
- Don't commit `.only` or `.skip` in tests
- Don't rely on test execution order
- Don't share state between tests
- Don't forget to clean up test data
- Don't test implementation details in unit tests

## Test Utilities

### `tests/integration-utils.ts`

Helper functions for writing integration tests:

```typescript
// Create a test project (auto-tracked for cleanup)
const project = await createTestProject('My Test Project');

// Assert data structure matches TypeScript types
assertSourceStructure(source); // Throws if missing required fields

// Wait for async operations
await waitFor(() => someCondition === true, 5000);

// Clean up all tracked test data
await testData.cleanup();
```

## Troubleshooting

### "invoke is not defined"

Integration tests run in Node environment, not browser. The Tauri `invoke` function needs the backend running. Currently, integration tests assume you have the app running in dev mode.

**TODO**: Add automated backend startup for integration tests.

### "Test hangs forever"

Integration tests have 10s timeout. If a test hangs:
1. Check if backend is running
2. Check if test is waiting for something that never happens
3. Check for infinite loops

### "Integration tests fail but unit tests pass"

This usually means:
1. TypeScript types don't match backend schema (expected!)
2. Backend behavior changed
3. Test data wasn't cleaned up properly

This is actually **good** - integration tests caught a real issue!

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Auto-start Tauri backend for integration tests
- [ ] Add performance benchmarks
- [ ] Add test coverage reports
- [ ] Generate TypeScript types from Rust (ts-rs)

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Tauri Testing](https://tauri.app/v1/guides/testing/)
