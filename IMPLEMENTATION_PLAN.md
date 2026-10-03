# Implementation Plan: State Persistence, Error Boundaries, TypeScript

## Overview
This plan covers three major improvements to Arcanum's robustness and developer experience:
1. **State Persistence** - Never lose work on refresh
2. **Error Boundaries** - Graceful failure handling
3. **TypeScript Migration** - Type safety and better DX

---

## Phase 1: State Persistence (Week 1, ~8 hours)

### Goal
Persist user's work (tabs, project state, entity data) across browser refreshes and app restarts.

### Technical Approach
Use Zustand's `persist` middleware with IndexedDB storage.

### Implementation Steps

#### Step 1.1: Setup Persistence Middleware (2 hours)
```javascript
// src/store/useStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval'; // Tiny IndexedDB wrapper

const storage = {
  getItem: async (name) => get(name),
  setItem: async (name, value) => set(name, value),
  removeItem: async (name) => del(name),
};

const useStore = create(
  persist(
    (set) => ({ /* existing state */ }),
    {
      name: 'arcanum-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        // Only persist these - not heavy objects
        currentProject: state.currentProject,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        places: state.places,
        people: state.people,
        events: state.events,
        theories: state.theories,
        artifacts: state.artifacts,
        // DON'T persist: sources (heavy PDFs), canvases (large)
      }),
      version: 1, // For future migrations
    }
  )
);
```

#### Step 1.2: Install Dependencies
```bash
npm install idb-keyval
```

#### Step 1.3: Add Hydration UI (1 hour)
```javascript
// src/components/LoadingScreen.jsx
export function LoadingScreen() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from IndexedDB
    useStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
  }, []);

  if (!isHydrated) {
    return <div>Restoring your work...</div>;
  }

  return <App />;
}
```

#### Step 1.4: Handle Data Migrations (1 hour)
```javascript
// Future-proof: Handle schema changes
migrate: (persistedState, version) => {
  if (version === 0) {
    // Migrate from v0 to v1
    persistedState.newField = 'default';
  }
  return persistedState;
}
```

#### Step 1.5: Testing (2 hours)
- Test: Open project → refresh → project still open ✓
- Test: Create entity → refresh → entity still there ✓
- Test: Open tabs → refresh → tabs still open ✓
- Test: Large projects (100+ entities) → performance OK ✓
- Test: Clear storage manually → app resets gracefully ✓

#### Step 1.6: Add Clear Cache Button (1 hour)
```javascript
// Settings panel
<button onClick={() => {
  useStore.persist.clearStorage();
  window.location.reload();
}}>
  Clear All Cached Data
</button>
```

**Deliverable:** Work persists across refreshes, fast app startup with cached data

**Risks:**
- IndexedDB quota limits (50MB-1GB depending on browser)
- Mitigation: Only persist essential data, add quota monitoring

---

## Phase 2: Error Boundaries (Week 2, ~12 hours)

### Goal
Prevent component crashes from breaking the entire app. Graceful degradation.

### Implementation Steps

#### Step 2.1: Create Base ErrorBoundary (2 hours)
```javascript
// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });

    // Log to console in dev
    console.error('ErrorBoundary caught:', error, errorInfo);

    // TODO: Send to error tracking service (Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {this.state.error?.toString()}
            {this.state.errorInfo?.componentStack}
          </details>
          <button onClick={this.handleReset}>Try Again</button>
          <button onClick={() => window.location.reload()}>
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Step 2.2: Wrap Critical Features (3 hours)
```javascript
// src/components/Workspace.jsx
<ErrorBoundary fallback={<PDFViewError />}>
  <Suspense fallback={<LoadingFallback />}>
    <PDFView />
  </Suspense>
</ErrorBoundary>

<ErrorBoundary fallback={<MapViewError />}>
  <Suspense fallback={<LoadingFallback />}>
    <MapView />
  </Suspense>
</ErrorBoundary>

<ErrorBoundary fallback={<CanvasError />}>
  <ResearchCanvas />
</ErrorBoundary>
```

#### Step 2.3: Create Specific Error Fallbacks (3 hours)
```javascript
// src/components/errors/PDFViewError.jsx
export function PDFViewError() {
  return (
    <div className="error-state">
      <h3>PDF Viewer Unavailable</h3>
      <p>The PDF viewer encountered an error. Your work is safe.</p>
      <button onClick={() => /* retry */}>Reload PDF</button>
    </div>
  );
}
```

#### Step 2.4: Add Async Error Handling (2 hours)
```javascript
// src/hooks/useAsyncWithErrorBoundary.js
export function useAsyncWithErrorBoundary(asyncFn) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    asyncFn()
      .then(data => {
        if (!cancelled) setState({ loading: false, data, error: null });
      })
      .catch(error => {
        if (!cancelled) {
          // Errors here WON'T be caught by ErrorBoundary (async)
          // So we handle them in state instead
          setState({ loading: false, data: null, error });
        }
      });

    return () => { cancelled = true; };
  }, [asyncFn]);

  return state;
}
```

#### Step 2.5: Testing (2 hours)
- Test: Force PDFView error → only PDF fails, rest of app works ✓
- Test: Force MapView error → can still access entities ✓
- Test: Network error → graceful error message ✓
- Test: Reset button → component recovers ✓

**Deliverable:** App survives component crashes, clear error messages, retry mechanisms

**Risks:**
- Error boundaries don't catch async errors (event handlers, setTimeout)
- Mitigation: Use try-catch for async operations + error state

---

## Phase 3: TypeScript Migration (Weeks 3-12, ~40-60 hours)

### Goal
Gradual migration to TypeScript for type safety, better DX, fewer bugs.

### Migration Strategy: Incremental (NOT Big Bang)

#### Week 3-4: Foundation (8 hours)

**Step 3.1: Setup TypeScript**
```bash
npm install -D typescript @types/react @types/react-dom
npx tsc --init
```

**Step 3.2: Configure tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    // CRITICAL: Allow gradual migration
    "allowJs": true,           // JS and TS coexist
    "checkJs": false,          // Don't type-check JS files
    "noEmit": true,            // Vite handles compilation

    // Strict mode (enable gradually)
    "strict": false,           // Start false, enable later
    "noImplicitAny": false,

    // Quality of life
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3.3: Update Vite config (if needed)**
Vite already supports .ts/.tsx out of the box!

#### Week 5-6: Convert Utilities First (12 hours)

**Priority order:**
1. Config files (easiest)
2. Utility functions (pure logic)
3. Custom hooks
4. Store (Zustand)
5. Components (last)

**Example:**
```typescript
// src/config/entityCommands.ts (was .js)
export interface EntityCommand {
  command: string;
  param: string;
}

export const GET_COMMANDS: Record<string, EntityCommand> = {
  person: { command: 'get_person', param: 'person_id' },
  // ... now with autocomplete!
};
```

```typescript
// src/lib/entityCrud.ts (was .js)
export interface Entity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOptions {
  hasAnnotationLink?: boolean;
  hasRelationshipType?: boolean;
  pluralOverride?: string;
}

export function createEntityCrud(
  entityType: string,
  options: CreateOptions = {}
) {
  // TypeScript ensures you use options correctly
}
```

#### Week 7-8: Convert Store (12 hours)

```typescript
// src/store/useStore.ts (was .js)
import { create } from 'zustand';

interface Person {
  id: string;
  name: string;
  role: string;
  birth_year: number | null;
  death_year: number | null;
  bio: string;
}

interface StoreState {
  people: Person[];
  setPeople: (people: Person[]) => void;
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;
}

const useStore = create<StoreState>((set) => ({
  people: [],
  setPeople: (people) => set({ people }),
  addPerson: (person) => set((state) => ({
    people: [...state.people, person]
  })),
  // ... IDE now autocompletes everything!
}));
```

#### Week 9-12: Convert Components (16-20 hours)

**Start with small components:**
```typescript
// src/components/ModeBanner.tsx (was .jsx)
interface ModeBannerProps {
  message: string;
  variant?: 'primary' | 'secondary';
  onCancel?: () => void;
}

export default function ModeBanner({
  message,
  variant = 'primary',
  onCancel
}: ModeBannerProps) {
  // TypeScript ensures props are correct
}
```

**Then larger components:**
```typescript
// src/components/EntityPage.tsx
interface EntityPageProps {
  entityId: string;
  entityType: 'person' | 'event' | 'theory' | 'place' | 'artifact';
  title: string;
  projectId: string;
  tabId: string;
}

export default function EntityPage({
  entityId,
  entityType,
  title,
  projectId,
  tabId
}: EntityPageProps) {
  // Catches bugs like passing wrong entityType
}
```

#### Week 13+: Enable Strict Mode (Ongoing)

Once most code is TypeScript:
```json
{
  "compilerOptions": {
    "strict": true,           // Full type checking
    "noImplicitAny": true,    // No 'any' without explicit annotation
  }
}
```

### Testing Strategy
- Tests continue to work (Vitest supports TS out of box)
- Add type tests: `expectType<Person>(person);`
- Use `tsc --noEmit` in CI to catch type errors

**Deliverable:**
- Week 4: Foundation + config files migrated
- Week 8: All utilities + store migrated
- Week 12: Most components migrated
- Month 4+: Full TypeScript, strict mode enabled

---

## TypeScript: Is It the Best Alternative?

### What Are The Alternatives?

#### Option 1: JSDoc (Type annotations in comments)
```javascript
/**
 * @param {string} id
 * @param {Partial<Person>} updates
 */
function updatePerson(id, updates) { ... }
```
**Pros:** No build step, works with plain JS
**Cons:** Verbose, no refactoring support, easy to forget

#### Option 2: Flow (Facebook's type system)
```javascript
// @flow
function updatePerson(id: string, updates: $Shape<Person>) { ... }
```
**Pros:** Similar to TypeScript
**Cons:** **Dead project** - Facebook abandoned it for TypeScript

#### Option 3: PropTypes (React only)
```javascript
Component.propTypes = {
  name: PropTypes.string.isRequired
};
```
**Pros:** Built into React
**Cons:** **Runtime only**, components only, deprecated in favor of TS

### The Winner: TypeScript

**Why TypeScript is the industry standard:**

1. **Adoption:** 78% of developers use it (Stack Overflow 2024)
2. **Tooling:** Best IDE support (VSCode, IntelliJ)
3. **Ecosystem:** Types for every library (`@types/react`, etc.)
4. **Active:** Microsoft invests heavily, releases every 3 months
5. **Career:** Required for most React jobs now

**For Arcanum specifically:**

Your app has **complex data models:**
- Entities with relationships (person → event → place)
- Annotations with geometry coordinates
- Knowledge graph edges
- Map coordinates and projections

TypeScript prevents bugs like:
- Passing `personId` where `placeId` expected
- Forgetting required fields when creating entities
- Typos in property names (`person.nam` vs `person.name`)
- Wrong coordinate format (lat/lng swapped)

**Verdict:** Yes, TypeScript is the best choice. No viable alternative exists for modern React.

---

## Effort Estimation Summary

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| State Persistence | Week 1 | 8 hours | HIGH |
| Error Boundaries | Week 2 | 12 hours | HIGH |
| TypeScript Setup | Week 3-4 | 8 hours | MEDIUM |
| TypeScript Utilities | Week 5-6 | 12 hours | MEDIUM |
| TypeScript Store | Week 7-8 | 12 hours | MEDIUM |
| TypeScript Components | Week 9-12 | 20 hours | LOW |
| **TOTAL** | **12 weeks** | **72 hours** | - |

## Recommended Approach

### Option A: Sequential (Safest)
Week 1-2: State Persistence + Error Boundaries (HIGH priority)
Week 3+: TypeScript migration (MEDIUM/LOW priority)

### Option B: Parallel (Faster)
- One dev: State Persistence + Error Boundaries
- Another dev: TypeScript migration
- Both: Code review together

### Option C: New-Files-Only TypeScript (Pragmatic)
- Weeks 1-2: State Persistence + Error Boundaries
- Week 3+: All NEW files written in TypeScript
- OLD files: Convert only when editing

**I recommend Option C:** Get immediate wins (persistence, errors), adopt TypeScript gradually for new code.

---

## Next Steps

1. **Now:** Review this plan
2. **This week:** Implement State Persistence (8 hours)
3. **Next week:** Implement Error Boundaries (12 hours)
4. **Week 3:** Setup TypeScript, start using for new files
5. **Ongoing:** Gradual TS migration as you touch files

Questions? Let me know which approach you prefer!
