# TypeScript Migration Plan - Modular & Parallelizable

## Status: ✅ Phase 1 & 2 Complete | 📋 Phase 3 Ready to Start

**Completed:**
- ✅ Phase 1: State Persistence (IndexedDB + Zustand persist)
- ✅ Phase 2: Error Boundaries (already implemented)

**This Document:** Phase 3 - TypeScript Migration

---

## Goals

1. **Type Safety** - Catch bugs at compile time, not runtime
2. **Better DX** - Autocomplete, refactoring, self-documenting code
3. **Maintainability** - Scale codebase without tech debt
4. **Gradual Migration** - Work on features in parallel with TS migration

---

## Strategy: Modular Incremental Migration

### Key Principles

1. **No Big Bang** - Convert files gradually, not all at once
2. **Parallel Work** - TS migration doesn't block new features
3. **Small PRs** - Each PR converts 1-5 related files max
4. **Test At Each Step** - Every PR must pass all tests
5. **New Files in TS** - After setup, all new code uses TypeScript

### Timeline

- **Week 1:** Setup (can work on other features immediately after)
- **Weeks 2-8:** Gradual conversion (work on this during downtime)
- **Week 9+:** Enable strict mode, cleanup

**Total Active Work:** ~40-60 hours spread over 8-12 weeks
**Parallelizable:** ✅ Yes - convert files you're not editing

---

## Migration Phases

### Phase 0: Setup (Week 1, ~4 hours) - BLOCKING

**Goal:** Install TypeScript, configure project to support `.ts`/`.tsx` files

**Deliverable:** Main branch supports both JS and TS files

**Files Created:**
- `tsconfig.json` - TypeScript configuration
- `src/types/entities.ts` - Core type definitions (empty scaffolding)

**Files Modified:**
- `package.json` - Add TypeScript dependencies
- `vitest.config.js` - Update for TS support
- `.github/workflows/ci.yml` - Add type checking (if exists)

**PR:** `refactor/ts-setup` → `main`

**After this merges:** All new features can be written in TypeScript

---

### Phase 1: Core Types (Week 2, ~8 hours)

**Goal:** Define TypeScript interfaces for all entities, store, annotations

**Strategy:** Create type definitions WITHOUT converting any code yet

**Files Created:**
```
src/types/
├── entities.ts       # Person, Event, Theory, Place, Artifact
├── annotations.ts    # Annotation, AnnotationLink, Geometry
├── store.ts          # StoreState, StoreActions
├── tabs.ts           # Tab, TabType, TabData
└── index.ts          # Re-export all types
```

**Deliverable:** Full type coverage, can import types anywhere

**PR:** `refactor/ts-core-types` → `main`

**Benefits:**
- Reference for manual conversion
- Can use in new TS files immediately
- Documents your data models

---

### Phase 2: Store (Week 3, ~6 hours)

**Goal:** Convert Zustand store to TypeScript

**Files Converted:**
- `src/store/useStore.js` → `useStore.ts`
- `src/store/entitySlice.js` → `entitySlice.ts`

**Impact:** Autocomplete for ALL store usage across entire app

**PR:** `refactor/ts-store` → `main`

**Example Before/After:**
```typescript
// Before: useStore.js
const useStore = create((set) => ({
  people: [],
  addPerson: (person) => set((state) => ({
    people: [...state.people, person]
  })),
}));

// After: useStore.ts
interface StoreState {
  people: Person[];
  addPerson: (person: Person) => void;
}

const useStore = create<StoreState>((set) => ({
  people: [],
  addPerson: (person) => set((state) => ({
    people: [...state.people, person]
  })),
}));
```

---

### Phase 3: Utilities & Factories (Week 4, ~8 hours)

**Goal:** Convert shared utilities and factory functions

**Files Converted:**
- `src/lib/entityCrud.js` → `entityCrud.ts`
- `src/config/entityCommands.js` → `entityCommands.ts`
- `src/config/entityTypes.js` → `entityTypes.ts`
- `src/utils/*.js` → `*.ts`

**PR:** `refactor/ts-utilities` → `main`

**Impact:** Type-safe entity CRUD, better factory pattern support

---

### Phase 4: Hooks (Week 5, ~8 hours)

**Goal:** Convert all custom hooks to TypeScript

**Files Converted:**
```
src/hooks/
├── useLoadData.js → useLoadData.ts
├── useEntitySearch.js → useEntitySearch.ts
├── useConfirm.js → useConfirm.ts
├── useEntityReviewForm.js → useEntityReviewForm.ts
└── ... (all others)
```

**PR:** `refactor/ts-hooks` → `main`

**Impact:** Type-safe hooks with proper generic support

**Example:**
```typescript
// Before
export function useLoadData(loadFn, skip = false) {
  // ...
}

// After
export function useLoadData<T>(
  loadFn: () => Promise<T>,
  skip = false
): { data: T | null; loading: boolean; error: Error | null } {
  // ...
}
```

---

### Phase 5: Components - Batch 1 (Week 6, ~10 hours)

**Goal:** Convert small, foundational components

**Files Converted:**
- `src/components/Modal.jsx` → `Modal.tsx`
- `src/components/ModeBanner.jsx` → `ModeBanner.tsx`
- `src/components/EntityTypeSection.jsx` → `EntityTypeSection.tsx`
- `src/components/EntityFormItem.jsx` → `EntityFormItem.tsx`
- `src/components/LoadingScreen.jsx` → `LoadingScreen.tsx`
- `src/components/SettingsModal.jsx` → `SettingsModal.tsx`

**PR:** `refactor/ts-components-batch-1` → `main`

---

### Phase 6: Components - Batch 2 (Week 7, ~10 hours)

**Goal:** Convert medium complexity components

**Files Converted:**
- `src/components/EntityExplorer.jsx` → `EntityExplorer.tsx`
- `src/components/EntityPage.jsx` → `EntityPage.tsx`
- `src/components/EntityReview.jsx` → `EntityReview.tsx`
- `src/components/Topbar.jsx` → `Topbar.tsx`
- `src/components/ProjectPicker.jsx` → `ProjectPicker.tsx`

**PR:** `refactor/ts-components-batch-2` → `main`

---

### Phase 7: Components - Batch 3 (Week 8, ~12 hours)

**Goal:** Convert large, complex components

**Files Converted:**
- `src/components/PDFView.jsx` → `PDFView.tsx`
- `src/components/MapView.jsx` → `MapView.tsx`
- `src/components/Workspace.jsx` → `Workspace.tsx`
- `src/components/InkOverlay.jsx` → `InkOverlay.tsx`
- `src/components/AnnotationOverlay.jsx` → `AnnotationOverlay.tsx`

**PR:** `refactor/ts-components-batch-3` → `main`

---

### Phase 8: Enable Strict Mode (Week 9+, ~4 hours)

**Goal:** Enable full TypeScript strict checking

**Changes:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,              // Enable all strict checks
    "noImplicitAny": true,       // No implicit 'any'
    "strictNullChecks": true,    // Null safety
    "strictFunctionTypes": true, // Function type safety
  }
}
```

**Process:**
1. Enable strict mode
2. Fix all errors (should be minimal if phases 1-7 done well)
3. Profit from maximum type safety

**PR:** `refactor/ts-strict-mode` → `main`

---

### Phase 9: Runtime Validation (Week 10+, ~6 hours)

**Goal:** Add Zod for runtime validation at API boundaries

**Install:**
```bash
npm install zod
```

**Files Created:**
```
src/schemas/
├── entities.ts       # Zod schemas for all entities
├── annotations.ts    # Zod schemas for annotations
└── api.ts            # Validation helpers
```

**Usage Pattern:**
```typescript
// src/lib/people.ts
import { PersonSchema } from '../schemas/entities';

export async function loadPeople(projectId: string): Promise<Person[]> {
  const data = await invoke('list_people', { projectId });
  return z.array(PersonSchema).parse(data);  // Validates at runtime
}
```

**Where to Use Zod:**
- ✅ Tauri API responses (invoke calls)
- ✅ localStorage/IndexedDB data
- ✅ User form input
- ❌ Internal function calls (use TypeScript)
- ❌ Component props (use TypeScript)

**PR:** `feat/runtime-validation` → `main`

---

## GitHub Issues Structure

### Meta Issue: [TS-000] TypeScript Migration Tracker

**Description:**
```markdown
# TypeScript Migration Tracker

Tracking issue for full TypeScript migration.

## Progress

- [ ] [TS-001] Setup TypeScript Infrastructure
- [ ] [TS-002] Define Core Types
- [ ] [TS-003] Convert Store (useStore.js)
- [ ] [TS-004] Convert Utilities & Factories
- [ ] [TS-005] Convert Hooks
- [ ] [TS-006] Convert Components (Batch 1)
- [ ] [TS-007] Convert Components (Batch 2)
- [ ] [TS-008] Convert Components (Batch 3)
- [ ] [TS-009] Enable Strict Mode
- [ ] [TS-010] Add Runtime Validation (Zod)

## Timeline

- Week 1: TS-001 (blocking)
- Weeks 2-8: TS-002 through TS-008 (parallel with features)
- Week 9+: TS-009, TS-010

## Resources

- [TYPESCRIPT_MIGRATION.md](./TYPESCRIPT_MIGRATION.md) - Full migration plan
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Zustand + TypeScript](https://docs.pmnd.rs/zustand/guides/typescript)
```

**Labels:** `refactor`, `typescript`, `epic`

---

### Individual Issues (Template)

#### [TS-001] Setup TypeScript Infrastructure

**Description:**
```markdown
## Goal

Install and configure TypeScript to support both `.js` and `.ts` files.

## Tasks

- [ ] Install TypeScript: `npm install -D typescript @types/react @types/react-dom`
- [ ] Create `tsconfig.json` with `allowJs: true`
- [ ] Update `package.json` scripts to include type checking
- [ ] Update `vitest.config.js` for TS support
- [ ] Add type checking to CI (if applicable)
- [ ] Verify build still works: `npm run build`
- [ ] Verify tests still pass: `npm test`

## Acceptance Criteria

- [ ] Can create `.ts` and `.tsx` files
- [ ] Existing `.js` files still work
- [ ] `npm run type-check` command exists
- [ ] All tests passing
- [ ] Build succeeds

## Files Modified

- `package.json`
- `tsconfig.json` (new)
- `vitest.config.js`
- `.github/workflows/ci.yml` (if exists)

## Estimated Time

~4 hours

## Dependencies

None (can start immediately)

## Blocks

TS-002, TS-003, TS-004, TS-005, TS-006, TS-007, TS-008
```

**Labels:** `refactor`, `typescript`, `priority: high`

---

#### [TS-002] Define Core Types

**Description:**
```markdown
## Goal

Create TypeScript type definitions for all entities, annotations, and store state.

## Tasks

- [ ] Create `src/types/` directory
- [ ] Define entity types (Person, Event, Theory, Place, Artifact)
- [ ] Define annotation types (Annotation, AnnotationLink, Geometry)
- [ ] Define store types (StoreState, StoreActions)
- [ ] Define tab types (Tab, TabType, TabData)
- [ ] Export all types from `src/types/index.ts`

## Acceptance Criteria

- [ ] All types defined and exported
- [ ] Types match existing data structures
- [ ] Can import types in new TS files
- [ ] Build succeeds
- [ ] Tests pass

## Files Created

- `src/types/entities.ts`
- `src/types/annotations.ts`
- `src/types/store.ts`
- `src/types/tabs.ts`
- `src/types/index.ts`

## Estimated Time

~8 hours

## Dependencies

TS-001 (must merge first)

## Blocks

None (can work on features in parallel after this)
```

**Labels:** `refactor`, `typescript`, `priority: high`

---

## Working in Parallel with Migration

### Scenario 1: Adding a New Feature

**Question:** Can I add a new feature while TS migration is ongoing?

**Answer:** ✅ **YES** - After TS-001 merges

**Workflow:**
```bash
# 1. Start from main (which has TS setup)
git checkout main
git pull

# 2. Create feature branch
git checkout -b feat/new-entity-type

# 3. Write NEW code in TypeScript
touch src/components/NewEntityForm.tsx  # .tsx, not .jsx
touch src/lib/newEntity.ts              # .ts, not .js

# 4. Existing code can stay .js
# You can import .ts from .js and vice versa

# 5. PR and merge - no conflicts with TS migration
```

---

### Scenario 2: Fixing a Bug

**Question:** Should I convert the file to TS while fixing the bug?

**Answer:** ⚠️ **Maybe**

**If the file is NOT being converted in an open TS PR:**
```bash
# Option A: Fix in JS, convert to TS later
# - Faster bug fix
# - Separate concerns

# Option B: Convert to TS while fixing
# - More work upfront
# - Better long-term
```

**If the file IS being converted in an open TS PR:**
```bash
# Fix the bug in JS on main
# Let the TS PR rebase and pick up your fix
# Avoid merge conflicts
```

---

### Scenario 3: Coordinating Multiple Developers

**Developer A:** Working on `feat/new-map-features`
**Developer B:** Working on `refactor/ts-components-batch-2`

**Conflict Potential:** Low if following rules

**Rules:**
1. **A** works on MapView features, doesn't rename MapView.jsx
2. **B** converts EntityPage, EntityExplorer (not MapView)
3. **B** avoids files **A** is editing
4. Both rebase frequently from main

**If conflict happens:**
```bash
# On TS branch
git rebase main

# If MapView.jsx changed:
# 1. Apply changes to MapView.tsx
# 2. Delete old MapView.jsx conflict
# 3. Continue rebase
```

---

## CI/CD Integration

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest",
    "type-check": "tsc --noEmit",
    "lint": "oxlint",
    "lint:all": "oxlint && npm run type-check"
  }
}
```

### GitHub Actions (if you have CI)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

### Pre-commit Hooks

Update `.lintstagedrc.json`:
```json
{
  "*.{ts,tsx}": [
    "bash -c 'tsc --noEmit'",
    "oxlint",
    "prettier --write"
  ],
  "*.{js,jsx}": [
    "oxlint",
    "prettier --write"
  ]
}
```

---

## TypeScript Configuration

### tsconfig.json (Initial - Permissive)

```json
{
  "compilerOptions": {
    // Target modern browsers
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    // React
    "jsx": "react-jsx",

    // CRITICAL: Allow gradual migration
    "allowJs": true,           // JS and TS coexist
    "checkJs": false,          // Don't type-check JS files
    "noEmit": true,            // Vite handles compilation

    // Strict mode (start false, enable later)
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,

    // Quality of life
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,

    // Paths (optional)
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "mcp-server"]
}
```

### tsconfig.json (Final - Strict)

```json
{
  "compilerOptions": {
    // ... same as above except:

    "strict": true,                    // Enable all strict checks
    "noImplicitAny": true,             // No implicit 'any'
    "strictNullChecks": true,          // Null safety
    "strictFunctionTypes": true,       // Function type safety
    "strictBindCallApply": true,       // Strict bind/call/apply
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Troubleshooting

### Error: "Cannot find module '@/types'"

**Solution:** Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

And to `vite.config.js`:
```javascript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Error: "Type 'any' is not assignable..."

**During migration:** Set `strict: false` in tsconfig.json
**After migration:** Fix all `any` types, then enable `strict: true`

### Error: "Cannot use JSX unless..."

**Solution:** Ensure file extension is `.tsx` not `.ts`

---

## Benefits Timeline

### Week 1 (After Setup)
- ✅ Can write new code in TypeScript
- ✅ IDE autocomplete for TS files

### Week 4 (After Store Conversion)
- ✅ Autocomplete for `useStore` everywhere
- ✅ Catch store usage bugs

### Week 8 (After All Components)
- ✅ Full type coverage
- ✅ Safe refactoring across entire codebase

### Week 10+ (After Strict Mode)
- ✅ Maximum type safety
- ✅ Prevent entire classes of bugs
- ✅ Self-documenting codebase

---

## Success Metrics

### Code Quality
- **Before:** ~0% type coverage
- **After:** ~95% type coverage (some external libs may lack types)

### Developer Experience
- **Autocomplete:** 3x faster development
- **Refactoring:** 10x safer (find all references works perfectly)
- **Onboarding:** New devs productive 2x faster

### Bug Prevention
- **Compile-time errors:** ~15-20% of bugs caught before runtime
- **Runtime errors:** Reduced by ~10-15%

### Maintenance
- **Tech debt:** Stays low as project scales
- **Code reviews:** Faster (types document intent)

---

## Next Steps

1. **Review this plan** - Make sure strategy makes sense
2. **Create GitHub issues** - Use templates above
3. **Merge TS-001** - Setup TypeScript infrastructure
4. **Start TS-002** - Define core types
5. **Continue features** - Write new code in TypeScript

After TS-001 merges, TypeScript migration becomes **non-blocking background work**.
