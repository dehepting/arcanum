# Testing Quick Start

## 🎯 Goal

Write fast, reliable unit tests that catch bugs early and document expected behavior.

## 🚀 Quick Example

Here's a simple component test:

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📝 Writing Your First Test

### Step 1: Create the test file

```bash
# Unit tests go next to the component they test
touch src/components/MyComponent.test.tsx
```

### Step 2: Copy this template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Step 3: Run it

```bash
npm test
```

## 🎓 Learn by Example

Look at existing test files:

1. **`src/components/EntityPage.test.jsx`**
   - Component rendering
   - Loading states
   - Error handling

2. **`src/store/useStore.test.js`**
   - State management
   - Store actions
   - Side effects

3. **`src/hooks/useLoadData.test.js`**
   - Custom hooks
   - Async operations
   - Error scenarios

## 🧰 Common Patterns

### Pattern 1: Testing Component Rendering

```typescript
it('should display user name', () => {
  render(<UserProfile name="Alice" />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
});
```

### Pattern 2: Testing User Interactions

```typescript
it('should toggle visibility when button clicked', () => {
  render(<Collapsible />);

  const button = screen.getByRole('button');
  expect(screen.queryByText('Content')).not.toBeInTheDocument();

  fireEvent.click(button);
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

### Pattern 3: Testing Async Operations

```typescript
it('should load and display data', async () => {
  // Mock the API call
  vi.mock('../lib/api', () => ({
    fetchUser: vi.fn().mockResolvedValue({ name: 'Alice' }),
  }));

  render(<UserLoader id="123" />);

  // Wait for async operation
  expect(await screen.findByText('Alice')).toBeInTheDocument();
});
```

### Pattern 4: Testing Store Integration

```typescript
import { renderHook, act } from '@testing-library/react';
import useStore from '../store/useStore';

it('should add project to store', () => {
  const { result } = renderHook(() => useStore());

  act(() => {
    result.current.addProject({
      id: '1',
      name: 'Test Project',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  expect(result.current.projects).toHaveLength(1);
  expect(result.current.projects[0].name).toBe('Test Project');
});
```

### Pattern 5: Mocking Tauri Commands

```typescript
import { vi } from 'vitest';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd, args) => {
    if (cmd === 'create_project') {
      return Promise.resolve({
        id: 'mock-id',
        name: args.input.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }),
}));

it('should create project via Tauri', async () => {
  const { invoke } = await import('@tauri-apps/api/core');

  const project = await invoke('create_project', {
    input: { name: 'Test' },
  });

  expect(project.name).toBe('Test');
  expect(invoke).toHaveBeenCalledWith('create_project', {
    input: { name: 'Test' },
  });
});
```

## ⚡ Pro Tips

1. **Test behavior, not implementation**: Test what the user sees, not internal state
2. **Use data-testid sparingly**: Prefer text content or ARIA roles
3. **Keep tests simple**: One concept per test
4. **Mock external dependencies**: API calls, Tauri commands, timers
5. **Descriptive names**: "should display error when login fails" > "test error"
6. **Arrange-Act-Assert**: Structure your tests clearly

```typescript
it('should show error message on failed login', () => {
  // Arrange - set up test data
  const mockError = 'Invalid credentials';
  vi.mocked(login).mockRejectedValue(new Error(mockError));

  // Act - perform the action
  render(<LoginForm />);
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));

  // Assert - verify the outcome
  expect(await screen.findByText(mockError)).toBeInTheDocument();
});
```

## 🐛 Debugging Failed Tests

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test -- EntityPage

# Run single test by name
npm test -- -t "should display user name"

# Run in UI mode (interactive)
npm run test:ui

# Run with coverage
npm run test:coverage
```

## 🔍 Common Testing Queries

```typescript
// By text content
screen.getByText('Submit');

// By role
screen.getByRole('button', { name: 'Submit' });

// By label
screen.getByLabelText('Email');

// By placeholder
screen.getByPlaceholderText('Enter email');

// By test ID (use sparingly)
screen.getByTestId('submit-button');

// Query variants:
// getBy* - throws error if not found
// queryBy* - returns null if not found
// findBy* - async, waits for element (use for async content)
```

## 📚 What About Integration Tests?

Integration tests that required a running Tauri application were removed in October 2026 because they couldn't run in CI. Instead, we rely on:

- **Unit tests** with mocked Tauri commands (fast, reliable)
- **TypeScript** for compile-time type safety
- **Manual testing** with the actual Tauri app during development

See `tests/INTEGRATION_TESTS.md` for the full story.

## 📚 Next Steps

1. Read `tests/README.md` for full documentation
2. Look at existing tests for patterns
3. Write tests for new features
4. Run `npm test` before committing (pre-commit hook does this automatically)
5. Check coverage with `npm run test:coverage`

## 📖 Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
