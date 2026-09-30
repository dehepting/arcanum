# Phase 2-4 Implementation Status

## 🚨 CRITICAL ISSUE DISCOVERED

**Supabase references found in frontend components that MUST be removed.**

Several components (`AnnotationModal.jsx`, `AnnotationOverlay.jsx`, `InkOverlay.jsx`, `App.jsx`) are still directly calling Supabase instead of using Tauri commands. This violates the architecture.

**See `SUPABASE_CLEANUP_NEEDED.md` for detailed cleanup plan.**

All annotation operations should use Tauri commands from `src-tauri/src/commands/annotations.rs`.

---

## Overview
Phases 2-4 have backend infrastructure complete. Frontend UI implementation deferred for comprehensive end-to-end testing.

## ✅ Phase 1: Unified Annotation→Entity Linking (COMPLETE)

**Backend:**
- ✅ `annotation_entity_links` table supporting all entity types
- ✅ 4 Tauri commands: link, unlink, get_entities, get_annotations
- ✅ Migration with FK validation
- ✅ Proper migrations tracking table

**Frontend:**
- ✅ `src/lib/annotationLinks.js` wrapper functions
- ✅ AnnotationModal with EntityPicker integration
- ✅ Link/unlink UI with entity icons
- ✅ Display linked entities in modal

**Tests:**
- ✅ 21 comprehensive tests in `annotationLinks.test.js`
- ✅ All 438 tests passing

## ✅ Phase 2: Image Sources & Entity Profile Photos (BACKEND COMPLETE)

**Backend Complete:**
- ✅ Added `profile_photo_url TEXT` to: people, events, theories, places, artifacts
- ✅ Added `source_type TEXT DEFAULT 'pdf'` to sources table
- ✅ Migration function `migrate_add_profile_photos_and_source_type()`
- ✅ Schema supports images, URLs, books, any source type

**Frontend (Deferred):**
- [ ] Image upload UI (drag-drop like PDFs)
- [ ] Image viewer component with annotations
- [ ] Entity profile photo upload modals
- [ ] Display profile photos in entity views/cards
- [ ] Image thumbnail generation

**Use Cases Enabled:**
- Upload historical maps → annotate places
- Upload photographs → annotate people
- Upload diagrams → annotate theories
- Entity profile photos for visual identification

## 🔄 Phase 3: MCP AI-Assisted Entity Linking (INFRASTRUCTURE EXISTS)

**Existing MCP Server (`/mcp-server`):**
- ✅ MCP server setup with @modelcontextprotocol/sdk
- ✅ Tools for: annotations, artifacts, people, events, places, theories, projects, provenance
- ✅ SQLite database integration via better-sqlite3
- ✅ Connects to Tauri database: `~/Library/Application Support/com.arcanum.app/arcanum.db`

**AI Tools To Implement:**
- [ ] `find_entities_in_text` - Extract entity mentions from text
- [ ] `suggest_entity_links` - Suggest links for an annotation
- [ ] `extract_entities_from_annotation` - Create entities from annotation
- [ ] `auto_link_annotations` - Bulk process entire PDFs

**Frontend To Implement:**
- [ ] "AI Suggest Links" button on AnnotationModal
- [ ] Review/approve suggestions modal with confidence scores
- [ ] Bulk process button on PDF viewer
- [ ] Progress indicator for async operations

**Integration Notes:**
- MCP server already uses SQLite (better-sqlite3)
- Direct access to Tauri's arcanum.db database
- AI tools can read from SQLite directly (no IPC needed)
- Commands in `src-tauri/src/commands/annotations.rs` provide fallback data access

## 🔄 Phase 4: Canvas Image Support (DEFERRED)

**Infrastructure Ready:**
- ✅ source_type supports 'image'
- ✅ Annotation system works on rectangles (source-agnostic)
- ✅ Entity linking works regardless of source type

**To Implement:**
- [ ] Image viewer component (similar to PDF viewer)
- [ ] Canvas integration for image layers
- [ ] Image positioning/scaling controls
- [ ] Annotation overlay rendering on images
- [ ] Reuse AnnotationOverlay logic from PDF viewer

**Architecture Notes:**
- Current PDF annotation system at `src/components/AnnotationOverlay.jsx`
- Can be abstracted to work with any rect-based media
- Canvas already exists for map view

## Testing Strategy

### Current Status
- ✅ All 438 tests passing
- ✅ Phase 1 has comprehensive test coverage (21 tests)
- ✅ No breaking changes to existing functionality

### End-to-End Testing Plan
1. **Database Migration Testing**
   - Start app, verify both migrations run successfully
   - Check migrations table has both entries
   - Verify all entity tables have profile_photo_url
   - Verify sources has source_type

2. **Phase 1 Testing**
   - Create test entities (person, event, theory, place, artifact)
   - Create PDF annotation
   - Link annotation to each entity type
   - Unlink entities
   - Verify persistence (close/reopen)

3. **Phase 2 Testing** (when UI implemented)
   - Upload image as source
   - Add entity profile photos
   - View profile photos in entity cards

4. **Phase 3 Testing** (when AI tools implemented)
   - Test AI entity detection
   - Review AI suggestions
   - Bulk process annotations

5. **Phase 4 Testing** (when canvas images implemented)
   - Display image on canvas
   - Create annotations on image
   - Link image annotations to entities

## Dependencies & Versions

```json
{
  "tauri": "2.12.0",
  "@tauri-apps/api": "2.11.1",
  "@tauri-apps/cli": "2.11.5",
  "rust": "1.98.1",
  "@modelcontextprotocol/sdk": "^1.0.4"
}
```

## Database Schema Changes

### New Tables
```sql
CREATE TABLE migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
);
```

### Modified Tables
- All entity tables: + `profile_photo_url TEXT`
- sources: + `source_type TEXT DEFAULT 'pdf'`

### Migrations Applied
1. `annotation_entity_links_v1` - Consolidate annotation links
2. `add_profile_photos_and_source_type_v1` - Add photo support

## Next Steps

### Immediate (Before Full Testing)
1. Verify app starts without migration errors
2. Check database schema with SQLite viewer
3. Test basic annotation→entity linking flow

### Short Term (Complete Frontend)
1. Implement Phase 2 frontend (image upload, photos)
2. Implement Phase 3 AI tools + frontend
3. Implement Phase 4 canvas images

### Long Term (Enhancements)
- Image thumbnail generation
- AI confidence scoring UI
- Batch operations progress tracking
- Entity photo cropping/editing
- Multi-image sources

## Notes

- All backend changes are backwards compatible
- Existing data preserved through migrations
- New columns are nullable/have defaults
- Frontend changes are additive, no breaking changes
- MCP server already aligned with SQLite architecture

## Files Changed

### Phase 1 (Committed: 3e1e1c2)
- `src-tauri/src/db.rs` - Migration fix, migrations table
- `src-tauri/src/commands/migration.rs` - Remove unused import
- `src-tauri/Cargo.toml` - Tauri 2.12
- `package.json` - Pin Tauri versions
- `src/lib/annotationLinks.test.js` - New tests

### Phase 2 (Committed: 5fbada2)
- `src-tauri/src/db.rs` - Profile photos, source_type, migration

### Uncommitted
- This status document
