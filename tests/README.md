# Testing Guide

## Overview

Arcanum uses a **comprehensive testing approach** to ensure code quality:

1. **Unit Tests** - Fast, isolated component tests with mocked dependencies
2. **TypeScript** - Compile-time type safety and contract validation
3. **CI/CD** - Automated testing on every commit

> **Note**: Integration tests were removed in October 2026. See `tests/INTEGRATION_TESTS.md` for details.

## Test Types

### Unit Tests (467 tests)

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

### TypeScript Type Checking

**What it tests**: Type safety and interface contracts

**Run**: `npm run type-check`

**Speed**: Fast (~3 seconds)

**Use for**:
- Compile-time validation of types
- Catching type mismatches between frontend and backend
- Ensuring API contracts are maintained

**Example**:
```typescript
// TypeScript catches type errors at compile time
const project: Project = await createProject({
  name: 'Test',
  invalid_field: 'value', // ❌ Compile error - property doesn't exist
});
```

## Running Tests

```bash
# Run unit tests (fast feedback during development)
npm test

# Run unit tests once (no watch mode)
npm run test:run

# Type checking
npm run type-check

# Full quality check (linting + type check)
npm run lint:all

# Test with coverage report
npm run test:coverage
```

## Pre-commit Hook

**Automatic testing before every commit!**

The pre-commit hook runs automatically when you `git commit`:

1. **Lint-staged** (~2s) - Format and lint changed files with oxlint and prettier
2. **Unit Tests** (~5s) - All 467 unit tests must pass

**Why this matters:**
- Catches bugs before you push
- Ensures code is formatted consistently
- Fast feedback loop (~7 seconds total)

**Workflow:**
```bash
git add .
git commit -m "feat: add new feature"
# → Hook runs automatically:
#    ✅ Lint-staged (oxlint + prettier)
#    ✅ Unit tests (467 tests)
#    ✅ Commit succeeds!

git push
```

## CI/CD Pipeline

Every push/PR triggers:

1. **Quality Checks** (~45s)
   - Security audit
   - Code formatting check
   - Linting (oxlint)
   - Unit tests with coverage
   - Frontend build

2. **Unit Tests** (~30s)
   - Runs all 467 unit tests
   - Type checking (tsc --noEmit)
   - Linting

3. **Build Check** (~20s)
   - Validates production build works
   - Only runs if unit tests pass

**Total CI time**: ~1-2 minutes

**Note:** All tests run in CI without requiring a Tauri runtime. Type safety is enforced by TypeScript at compile time.

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

### Best Practices

✅ **DO**:
- Write unit tests for all new components and logic
- Use TypeScript to enforce type contracts
- Mock external dependencies in unit tests
- Use descriptive test names
- Test one thing per test
- Keep tests fast and independent

❌ **DON'T**:
- Don't commit `.only` or `.skip` in tests
- Don't rely on test execution order
- Don't share state between tests
- Don't test implementation details
- Don't mock what you own (test real code when possible)

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure dependencies are installed:
```bash
npm ci
```

### "Test hangs forever"

If a test hangs:
1. Check for infinite loops
2. Check for missing mock implementations
3. Add `timeout` option to the test
4. Use `vi.useFakeTimers()` if testing time-dependent code

### Type errors in tests

Run type check to see all errors:
```bash
npm run type-check
```

Common fixes:
- Add proper type annotations to test data
- Use `as const` for literal types
- Import types from source files

## Future Improvements

- [ ] Add E2E tests with Playwright (for full Tauri application testing)
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Generate TypeScript types from Rust (ts-rs) for better type safety
- [ ] Increase test coverage to 90%+

## Additional Documentation

- **Coverage Report**: See `tests/COVERAGE.md` for detailed coverage metrics
- **Quick Start Guide**: See `tests/QUICKSTART.md` for writing your first test
- **Integration Tests**: See `tests/INTEGRATION_TESTS.md` for why they were removed

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
