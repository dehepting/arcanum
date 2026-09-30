# 🚨 CRITICAL: Supabase References Must Be Removed

## Issue
Several frontend components are still directly calling Supabase instead of using Tauri commands. This violates the architecture where **ALL database operations should go through Tauri/Rust backend**.

## Files with Supabase References

### Components
- `src/components/AnnotationModal.jsx` - Lines 85, 112, 246, 272
- `src/components/AnnotationOverlay.jsx`
- `src/components/InkOverlay.jsx`
- `src/App.jsx`

### Libraries
- `src/lib/tauri.js`

### Tests
- `src/test/test-utils.jsx` (mock - OK)

## What Needs to Change

### AnnotationModal.jsx
**Current (WRONG):**
```javascript
const { data, error } = await supabase
  .from('annotations')
  .update({ text: noteText.trim() })
  .eq('id', pendingAnnotation.id)
  .select()
  .single();
```

**Should Be:**
```javascript
import { updateAnnotation } from '../lib/tauri';

const data = await updateAnnotation(pendingAnnotation.id, {
  text: noteText.trim()
});
```

### Available Tauri Commands

From `src-tauri/src/commands/annotations.rs`:
- ✅ `create_annotation(source_id, page_number, annotation_type, rect, text)`
- ✅ `update_annotation(annotation_id, updates)`
- ✅ `delete_annotation(annotation_id)`
- ✅ `load_annotations(source_id)`
- ✅ `link_annotation_to_entity(...)` (Phase 1)
- ✅ `unlink_annotation_from_entity(...)` (Phase 1)
- ✅ `get_entities_for_annotation(...)` (Phase 1)
- ✅ `get_annotations_for_entity(...)` (Phase 1)

## Implementation Plan

### 1. Update `src/lib/tauri.js`
Remove any Supabase imports and ensure all annotation functions call Tauri commands via `invoke()`.

### 2. Update `AnnotationModal.jsx`
Replace all Supabase calls:
- Line 85-90: Use `updateAnnotation(id, {text})`
- Line 112-116: Use `createAnnotation(...)`
- Line 246-252: Use `updateAnnotation(id, {text})`
- Line 272-276: Use `createAnnotation(...)`

### 3. Update `AnnotationOverlay.jsx`
Check for Supabase calls and replace with Tauri commands.

### 4. Update `InkOverlay.jsx`
Check for Supabase calls and replace with Tauri commands.

### 5. Update `App.jsx`
Remove Supabase client initialization if present.
Replace any direct Supabase calls with Tauri commands.

## Testing After Cleanup

1. **Verify No Supabase Imports:**
   ```bash
   grep -r "from '@supabase" src/ --exclude-dir=node_modules
   # Should return nothing
   ```

2. **Test Annotation CRUD:**
   - Create annotation
   - Edit annotation text
   - Delete annotation
   - Verify persistence

3. **Test Entity Linking:**
   - Link annotation to entity
   - Unlink annotation
   - Verify links persist

## Why This Matters

**Security:** Direct client-side database access bypasses Rust validation
**Architecture:** Violates single-source-of-truth principle
**Portability:** Supabase dependency prevents offline/local-only usage
**Performance:** Tauri commands are more efficient than network calls
**Correctness:** Database logic belongs in Rust, not JavaScript

## Current Architecture (CORRECT)

```
Frontend (React/JS)
    ↓ invoke()
Tauri Commands (Rust)
    ↓ rusqlite
SQLite Database
```

## Incorrect Pattern (REMOVE)

```
Frontend (React/JS)
    ↓ @supabase/supabase-js
Supabase Cloud ❌
```

## Status

- ❌ AnnotationModal still uses Supabase
- ❌ AnnotationOverlay needs checking
- ❌ InkOverlay needs checking
- ❌ App.jsx may have Supabase client init
- ✅ MCP Server correctly uses SQLite
- ✅ Tauri commands exist for all operations
- ✅ Phase 1 entity linking uses Tauri (correct)

## Priority

**HIGH - Must fix before shipping**

This is fundamental architecture cleanup that should be done before adding more features.
