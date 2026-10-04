# Code Coverage Guide

## Current Coverage (2026-10-04)

```
Overall: 66% statements | 60% branches | 68% functions | 66% lines

Breakdown:
- components/  61% - UI components
- hooks/       98% - Custom React hooks ✨
- lib/         67% - Business logic
- config/      60% - Configuration
```

## Coverage Philosophy

### What Coverage IS Good For

✅ **Finding untested code**
- "Oh, we never test the error handling path"
- "This entire function has no tests"
- "The delete button isn't covered"

✅ **Preventing regressions**
- CI fails if coverage drops significantly
- Ensures new code has tests

✅ **Guiding test writing**
- Start with 0% coverage module
- Write tests until you hit 70-80%

### What Coverage IS NOT

❌ **A quality metric**
- 100% coverage ≠ bug-free code
- You can have terrible tests with 100% coverage
- A test that just calls functions but doesn't assert anything is useless

❌ **A goal in itself**
- Don't write tests just to hit a number
- 70% coverage with good tests > 95% coverage with bad tests

## Realistic Coverage Targets

### For Arcanum (Tauri App)

**Unit Tests** (current config):
```javascript
thresholds: {
  statements: 60%,  // Currently at 66% ✅
  branches: 55%,    // Currently at 60% ✅
  functions: 60%,   // Currently at 68% ✅
  lines: 60%,       // Currently at 66% ✅
}
```

**Integration Tests**:
- **Don't track coverage** - they validate contracts, not lines
- Focus on: Does TypeScript match backend schema?
- Example: "Source has 'title' not 'name'" ← This is what matters

### By File Type

**UI Components** (50-70% is fine):
- Hard to test every visual state
- Focus on: click handlers, state changes, edge cases
- Example: `EntityExplorer.tsx` at 46% is okay

**Business Logic** (80-90% target):
- Pure functions are easy to test thoroughly
- Example: `errorHandler.ts` at 97.56% ✅

**Hooks** (70-90% target):
- Custom hooks should be well-tested
- Example: Your hooks/ folder at 98% ✅

**Config Files** (50-60% is fine):
- Often just object definitions
- Example: `entityCommands.js` at 60% is okay

## Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report (detailed)
npm run test:coverage && open coverage/index.html

# Check if coverage meets thresholds (CI uses this)
npm run test:coverage -- --coverage.thresholds.autoUpdate=false
```

## Coverage Reports

After running `npm run test:coverage`, you get:

1. **Terminal output** - Quick overview
2. **HTML report** - `coverage/index.html` - Detailed, visual
3. **LCOV report** - `coverage/lcov.info` - For CI tools

**HTML Report** shows:
- Red lines = not tested
- Green lines = tested
- Yellow lines = partially tested (branches)

## Adding Coverage to CI

Already configured in `.github/workflows/test.yml`:

```yaml
- name: Run unit tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov (optional)
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## When to Increase Coverage Thresholds

**Good reasons**:
- ✅ You added lots of tests and coverage is now 75% (raise threshold to 70%)
- ✅ You're working on a critical module (payments, auth) - aim for 90%+
- ✅ Coverage keeps increasing naturally as you add features

**Bad reasons**:
- ❌ "We should have 100% coverage"
- ❌ "Other projects have 80% coverage"
- ❌ Management wants a higher number

## Coverage Best Practices

### DO

✅ **Test critical paths thoroughly**
```typescript
// Critical: User can delete their data
it('should delete all user data when account deleted', async () => {
  await deleteAccount(userId);
  const data = await fetchUserData(userId);
  expect(data).toBeNull(); // Actually verify it's gone!
});
```

✅ **Test error handling**
```typescript
// Coverage shows this error path is never tested
it('should handle network failure gracefully', async () => {
  mockApi.rejectOnce(new Error('Network error'));
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

✅ **Test edge cases**
```typescript
it('should handle empty array', () => {
  expect(processItems([])).toEqual([]);
});

it('should handle null input', () => {
  expect(processItems(null)).toEqual([]);
});
```

### DON'T

❌ **Write tests that don't assert anything**
```typescript
// BAD: 100% coverage but useless test
it('should render', () => {
  render(<MyComponent />);
  // No assertions! This test is worthless.
});
```

❌ **Test implementation details**
```typescript
// BAD: Testing internal state
it('should set loading to true', () => {
  const { result } = renderHook(() => useData());
  expect(result.current.isLoading).toBe(true); // Fragile!
});

// GOOD: Test user-visible behavior
it('should show loading spinner', () => {
  render(<MyComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

❌ **Aim for 100% coverage**
- Some code is hard to test (error boundaries, rare edge cases)
- Better to have 70% coverage with quality tests
- Than 100% coverage with brittle tests

## Integration Test Coverage

**Should you track coverage for integration tests?**

**NO** - Here's why:

1. **Integration tests validate contracts**, not lines
2. **One integration test** might only call 2 functions but validates critical data flow
3. **Coverage would be misleading** - 5% coverage but caught the Source type bug!

**What matters for integration tests**:
- ✅ Does TypeScript type match backend schema?
- ✅ Does data flow correctly through the stack?
- ✅ Can we create/read/update/delete entities?

**Not**:
- ❌ Did we execute every line?

## Recommended Workflow

### 1. When Writing New Code

```bash
# Write feature
# Write tests
npm run test:coverage

# Look at HTML report for your new file
# Did you test the error paths?
# Did you test edge cases?
```

### 2. When Fixing Bugs

```bash
# Before fixing bug
npm run test:coverage

# Write failing test that reproduces bug
npm test

# Fix bug
npm test  # Should pass now

# Check coverage increased
npm run test:coverage
```

### 3. Before Committing

```bash
# Run all tests + check coverage
npm run test:all
npm run test:coverage

# Coverage should not decrease
# If it decreased, add tests for new code
```

## Resources

- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)
- [Kent C. Dodds - Write Tests](https://kentcdodds.com/blog/write-tests)
- [Coverage Is Not Strongly Correlated with Test Suite Effectiveness](https://www.neverworkintheory.org/2021/09/16/coverage-is-not-strongly-correlated.html)

## Summary

**For Arcanum**:
- ✅ Unit tests: Track coverage, aim for 60-70%
- ✅ Integration tests: Don't track coverage, focus on contracts
- ✅ CI fails if coverage drops below thresholds
- ✅ Use coverage to find untested code, not as a goal

**Current status**: You're doing great! 66% coverage with good thresholds.
