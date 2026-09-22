# Testing Guide

This project uses **Vitest** and **React Testing Library** for testing.

## Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Component Tests

Place test files next to the component: `ComponentName.test.jsx`

```jsx
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent } from '../test/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />);
    expect(getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const mockFn = vi.fn();

    const { getByRole } = renderWithProviders(
      <MyComponent onClick={mockFn} />
    );

    await user.click(getByRole('button'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### Utility/Library Tests

Place test files next to the module: `moduleName.test.js`

```js
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('does something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

## Test Utilities

### `renderWithProviders(component, options)`

Renders a component with all necessary providers (store, router, etc.)

```jsx
const { getByText } = renderWithProviders(<MyComponent />, {
  initialState: { currentProject: mockProject }
});
```

### `createMockTauriClient()`

Creates a mock Tauri client for testing

```js
const mockTauri = createMockTauriClient();
vi.mock('./lib/tauri', () => ({
  createProject: vi.fn(),
  loadArtifacts: vi.fn()
}));
```

### `createMockStore(initialState)`

Creates a mock Zustand store with custom initial state

```js
const mockStore = createMockStore({
  currentProject: { id: '1', name: 'Test' },
  artifacts: []
});
```

## Mocking

### Mock a module

```js
vi.mock('./path/to/module', () => ({
  exportedFunction: vi.fn(),
  default: vi.fn()
}));
```

### Mock Zustand store

```js
import useStore from '../store/useStore';

vi.mock('../store/useStore');

// In your test
useStore.mockReturnValue({
  currentProject: mockProject,
  setCurrentProject: vi.fn()
});
```

### Mock Tauri Commands

```js
import * as tauri from './lib/tauri';

vi.mock('./lib/tauri', () => ({
  createProject: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
  loadArtifacts: vi.fn().mockResolvedValue([]),
  // ... mock other Tauri commands as needed
}));
```

## Best Practices

1. **Test behavior, not implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or implementation details

2. **Use semantic queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Clean up after tests**
   - The `afterEach(cleanup)` in setup.js handles this automatically
   - Reset mocks with `vi.clearAllMocks()` in `beforeEach`

4. **Use `describe` blocks for organization**
   - Group related tests together
   - Makes test output easier to read

5. **Write descriptive test names**
   - Use "should" or "it" conventions
   - Example: "should display error message when form is invalid"

6. **Test edge cases**
   - Empty states
   - Error states
   - Loading states
   - Boundary conditions

## Coverage Goals

- **Aim for 80%+ coverage** for critical paths
- **100% coverage** for utility functions
- **Focus on user-facing features** over implementation details

## Example Test Structure

```jsx
describe('MyComponent', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Happy path
  describe('when rendered with valid props', () => {
    it('should display the title', () => {
      // ...
    });
  });

  // Error states
  describe('when data fails to load', () => {
    it('should show error message', () => {
      // ...
    });
  });

  // User interactions
  describe('when user clicks button', () => {
    it('should call the handler', async () => {
      // ...
    });
  });
});
```

## Debugging Tests

```bash
# Run specific test file
npm test src/components/MyComponent.test.jsx

# Run tests matching pattern
npm test -- --grep="MyComponent"

# Run with UI for debugging
npm run test:ui
```

## CI Integration

Tests run automatically in CI on:
- Pull requests to main
- Pushes to main

The workflow fails if:
- Any test fails
- Coverage drops below threshold (if configured)
