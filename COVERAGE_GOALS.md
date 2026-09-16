# Test Coverage Goals

## Current Coverage (Baseline)
- **Overall:** 25.92%
- **Statements:** 25.92% (21/81)
- **Branches:** 34.78% (8/23)
- **Functions:** 15.51% (9/58)
- **Lines:** 23.52% (16/68)

**Files with tests:**
- ✅ `src/components/Topbar.jsx`
- ✅ `src/lib/annotations.js` (partial)

## Coverage Goals

### Phase 1: Critical Path (Target: 60% overall)
**Priority: HIGH** - Core functionality that users interact with daily

**Target Components:**
- `ArtifactList.jsx` - 80%
- `ArtifactDetail.jsx` - 70%
- `MapView.jsx` - 60%
- `PDFView.jsx` - 60%
- `Sidebar.jsx` - 70%
- `Workspace.jsx` - 80%

**Target Libraries:**
- `artifacts.js` - 90%
- `places.js` - 90%
- `artifact-sources.js` - 90%
- `annotations.js` - 100% (currently 36%)
- `upload.js` - 80%

### Phase 2: Feature Completeness (Target: 75% overall)
**Priority: MEDIUM** - Important features

**Target Components:**
- `AnnotationOverlay.jsx` - 70%
- `AnnotationModal.jsx` - 80%
- `ArtifactForm.jsx` - 75%
- `ProjectPicker.jsx` - 80%
- `Tabs.jsx` - 85%

**Target Libraries:**
- `overlays.js` - 85%
- `provenance.js` - 85%

### Phase 3: Full Coverage (Target: 85% overall)
**Priority: LOW** - Nice to have

**Target Components:**
- `ArtifactBadge.jsx` - 90%
- `ArtifactLinkModal.jsx` - 85%
- `ArtifactSourcesList.jsx` - 85%
- `ClaimsList.jsx` - 85%
- `InkOverlay.jsx` - 70%
- `OverlayGeoreference.jsx` - 70%
- `ProvenanceForm.jsx` - 80%
- `ProvenanceTimeline.jsx` - 80%

## Coverage Enforcement

### Minimum Thresholds (Enforced in CI)
```javascript
coverage: {
  thresholds: {
    statements: 60,
    branches: 50,
    functions: 55,
    lines: 60
  }
}
```

### Per-File Thresholds
- **Utility functions:** 90% minimum
- **Core components:** 70% minimum
- **UI-only components:** 60% minimum

## Testing Priorities

### 1. High Priority (Must Test)
- User authentication flow
- Artifact CRUD operations
- Annotation creation/editing
- Map interaction (placing pins, navigation)
- PDF navigation and rendering
- Source-artifact linking

### 2. Medium Priority (Should Test)
- Form validation
- Error handling
- Loading states
- Edge cases (empty states, null data)
- Provenance tracking
- Overlay georeferencing

### 3. Low Priority (Nice to Test)
- Visual styling
- Animation states
- Tooltip interactions
- Icon rendering

## Exclusions

Files excluded from coverage requirements:
- `src/test/*` - Test utilities
- `*.config.js` - Configuration files
- `src/lib/supabase.js` - External service wrapper (minimal logic)

## Milestone Targets

- **Week 1:** Reach 60% coverage (Phase 1)
- **Week 2:** Reach 75% coverage (Phase 2)
- **Week 3:** Reach 85% coverage (Phase 3)

## Current Gaps

**Untested Components (18):**
- AnnotationModal, AnnotationOverlay, ArtifactBadge, ArtifactDetail, ArtifactForm
- ArtifactLinkModal, ArtifactList, ArtifactSourcesList, ClaimsList, InkOverlay
- MapView, OverlayGeoreference, PDFView, ProjectPicker, ProvenanceForm
- ProvenanceTimeline, Sidebar, Tabs, Workspace

**Untested Libraries (6):**
- artifact-sources.js, artifacts.js, overlays.js, places.js, provenance.js, upload.js

**Partially Tested (1):**
- annotations.js (36% - needs completion)
