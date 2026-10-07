# Integration Tests - Removed

**Date Removed:** October 6, 2026
**Commit:** [chore/remove-integration-tests](https://github.com/dehepting/arcanum/pull/151)

## Overview

This document explains why integration tests were removed from the Arcanum codebase and provides guidance for future testing strategies.

## What Were Integration Tests?

Integration tests in this project were end-to-end tests that attempted to validate the full stack by directly invoking Tauri backend commands from the test environment. They were located in:

- `src/lib/__integration__/projects.integration.test.ts`
- `src/lib/__integration__/sources.integration.test.ts`
- `tests/integration-utils.ts` (helper utilities)
- `vitest.integration.config.ts` (configuration)

### Example Test Code

```typescript
import { invoke } from '@tauri-apps/api/core';

it('should create a project', async () => {
  const project = await invoke<Project>('create_project', {
    input: {
      name: 'Test Project',
      description: 'A test project for integration testing',
    },
  });

  expect(project).toBeDefined();
  expect(project.name).toBe('Test Project');
});
```

## Why They Failed

### The Core Problem

Integration tests were failing in CI with:

```
TypeError: Cannot read properties of undefined (reading 'invoke')
 ❯ invoke node_modules/@tauri-apps/api/core.js:328:39
```

### Root Cause

The `invoke` function from `@tauri-apps/api/core` requires access to `window.__TAURI__`, which is only available when running inside an actual Tauri desktop application. In CI environments:

1. **No Tauri Runtime**: GitHub Actions runs tests in a Node.js environment with JSDOM, not a Tauri webview
2. **No Window Object**: The `window.__TAURI__` object is injected by the Tauri runtime at application startup
3. **Cannot Be Mocked**: The Tauri API has deep integration requirements that make proper mocking extremely difficult

### Why This Wasn't Caught Earlier

- Tests passed locally when developers ran them **inside the running Tauri app** during development
- Unit tests run in Node.js with mocked dependencies, so they work fine
- Integration tests only failed in CI because CI doesn't have a Tauri runtime

## Why We Removed Them

### Option 1: Fix the Tests (Not Chosen)

**Potential Solutions Considered:**

1. **Mock `window.__TAURI__`**
   - ❌ Too complex - would require mocking the entire Tauri IPC layer
   - ❌ Doesn't validate real backend integration
   - ❌ Becomes a unit test in disguise

2. **Set up Headless Tauri in CI**
   - ❌ Requires X virtual framebuffer (Xvfb) setup
   - ❌ Significantly increases CI complexity and runtime
   - ❌ Brittle - prone to flakiness in CI environments
   - ❌ Expensive - requires more powerful CI runners

3. **Use Tauri's Testing Framework**
   - ❌ Tauri's official testing story for webview tests is still immature
   - ❌ WebDriver integration is complex and not well-documented
   - ❌ Would require significant investment for uncertain benefit

### Option 2: Remove the Tests (Chosen) ✅

**Rationale:**

1. **Limited Value**: Integration tests only validated data schemas, which are already covered by:
   - TypeScript type definitions
   - Unit tests with mocked API responses
   - Manual testing during development

2. **CI Blocker**: Integration test failures were blocking Dependabot PRs and other automated workflows

3. **Maintenance Burden**: Keeping non-functional tests creates confusion and technical debt

4. **Better Alternatives Exist**: The testing needs are better served by:
   - Comprehensive unit tests (467 passing tests)
   - TypeScript for compile-time type safety
   - Manual QA with the actual application

## What We Lost

By removing integration tests, we no longer have:

1. **Automated Backend Contract Validation**: Tests that verified backend responses match frontend expectations
2. **Schema Regression Detection**: Automated detection if backend changes break frontend types
3. **Full Stack Integration Confidence**: Assurance that frontend and backend work together

**However**, these needs are largely met by:
- **TypeScript**: Compile-time verification of type contracts
- **Unit Tests**: Validation of business logic with mocked API responses
- **Development Testing**: Manual testing during feature development
- **Type Definitions**: Shared types between frontend and Tauri backend

## Current Testing Strategy

### What We Test Now

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Unit Tests (467 tests)                        │
│  ✓ Component behavior                          │
│  ✓ Business logic                              │
│  ✓ State management                            │
│  ✓ Data transformations                        │
│  ✓ Mocked API interactions                     │
│                                                 │
│  TypeScript Compiler                           │
│  ✓ Type safety                                 │
│  ✓ Interface contracts                         │
│  ✓ Compile-time errors                         │
│                                                 │
│  Manual Testing                                │
│  ✓ Full Tauri application                      │
│  ✓ Real backend integration                    │
│  ✓ User workflows                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Coverage

- **Unit Test Coverage**: ~80% (see `tests/COVERAGE.md`)
- **Type Coverage**: 100% (all files migrated to TypeScript)
- **Integration Coverage**: Manual testing during development

## Future Recommendations

If integration testing becomes necessary in the future, consider:

### 1. Contract Testing

Instead of testing the full stack, use contract testing to verify API schemas:

```typescript
// Example using a contract testing approach
describe('API Contracts', () => {
  it('createProject response matches type', () => {
    const mockResponse = {
      id: 'uuid',
      name: 'Test',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    // This validates at compile time
    const project: Project = mockResponse;
    expect(project).toBeDefined();
  });
});
```

### 2. Playwright E2E Tests (If Needed)

For true end-to-end testing of the Tauri application:

```bash
npm install -D @playwright/test
```

```typescript
// tests/e2e/project-creation.spec.ts
import { test, expect } from '@playwright/test';

test('create new project', async ({ page }) => {
  await page.goto('http://localhost:1420'); // Tauri dev server
  await page.click('[data-testid="new-project"]');
  await page.fill('[data-testid="project-name"]', 'Test Project');
  await page.click('[data-testid="create"]');

  await expect(page.locator('[data-testid="project-title"]')).toHaveText('Test Project');
});
```

**Pros:**
- Tests real Tauri application
- Can run in CI with proper setup
- Industry-standard tool

**Cons:**
- Requires running Tauri dev server
- Slower than unit tests
- More complex CI setup

### 3. Tauri WebDriver (Experimental)

Tauri has experimental WebDriver support:

```toml
# src-tauri/Cargo.toml
[dev-dependencies]
tauri-driver = "2.0.0"
```

**Status**: Still experimental as of October 2026. Monitor Tauri documentation for updates.

## Related Documentation

- **Unit Testing Guide**: See `tests/README.md`
- **Test Coverage Report**: See `tests/COVERAGE.md`
- **Quick Start**: See `tests/QUICKSTART.md`

## Summary

Integration tests were removed because they:
1. ❌ Cannot run in CI without significant infrastructure
2. ❌ Provided limited value over existing unit tests
3. ❌ Were blocking automated workflows
4. ✅ Testing needs are met by unit tests + TypeScript + manual QA

The current testing strategy prioritizes fast, reliable unit tests with comprehensive coverage, backed by TypeScript's compile-time safety and manual integration testing during development.

---

**Last Updated**: October 6, 2026
**Related PR**: [#151](https://github.com/dehepting/arcanum/pull/151)
