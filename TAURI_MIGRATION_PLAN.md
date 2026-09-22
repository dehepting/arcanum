# Arcanum: Local-First Migration Plan
## Transition from Web App (Vercel + Supabase) to Desktop App (Tauri + SQLite)

---

## Executive Summary

**Goal**: Convert Arcanum from a cloud-hosted web app to a local-first desktop application.

**Why**:
- Unlimited local storage for books, PDFs, images
- Works offline (field research)
- Zero monthly costs
- Full data ownership and privacy
- Faster performance (no network latency)

**Technology Stack**:
- **Frontend**: Keep React + Vite (minimal changes)
- **Backend**: Tauri (Rust)
- **Database**: SQLite (replaces PostgreSQL)
- **Storage**: Local file system (replaces Supabase Storage)

---

## Phase 1: Foundation Setup (Week 1)

### 1.1 Initialize Tauri Project
- [ ] Install Tauri CLI: `npm install -D @tauri-apps/cli`
- [ ] Initialize Tauri: `npm run tauri init`
- [ ] Configure `tauri.conf.json` with app metadata
- [ ] Test basic Tauri build (hello world)

**Files to Create**:
```
src-tauri/
  ├── Cargo.toml          # Rust dependencies
  ├── tauri.conf.json     # App configuration
  └── src/
      └── main.rs         # Rust backend entry point
```

### 1.2 Set Up SQLite Database
- [ ] Add SQLite dependency: `diesel` or `rusqlite`
- [ ] Create database schema from Supabase schema
- [ ] Write migration scripts
- [ ] Test CRUD operations

**Schema Migration**:
```sql
-- Copy from Supabase schema:
- projects table
- sources table
- people, events, theories, places, artifacts tables
- entity_pages table
- entity_links table
- annotations, overlays, etc.
```

### 1.3 File System Structure
- [ ] Define local storage paths
- [ ] Create directory initialization on first launch
- [ ] Handle permissions (macOS sandbox)

**Directory Structure**:
```
~/Documents/Arcanum/
  ├── arcanum.db              # SQLite database
  ├── projects/
  │   └── {project-id}/
  │       ├── sources/        # PDF files
  │       │   └── {source-id}.pdf
  │       ├── entities/       # Entity page markdown
  │       │   └── {entity-type}/{entity-id}.md
  │       ├── overlays/       # Map overlay images
  │       │   └── {overlay-id}.png
  │       └── artifacts/      # Artifact images
  │           └── {artifact-id}.jpg
```

---

## Phase 2: Core Backend Services (Week 2)

### 2.1 File Management Commands
Create Tauri commands (Rust) for file operations:

- [ ] `upload_pdf(file_path) -> Result<Source>`
- [ ] `read_pdf(source_id) -> Result<Vec<u8>>`
- [ ] `delete_pdf(source_id) -> Result<()>`
- [ ] `list_sources(project_id) -> Result<Vec<Source>>`

### 2.2 Database Operations
Implement CRUD operations for all entities:

- [ ] Projects (create, read, update, delete, list)
- [ ] Sources (create, read, update, delete, list)
- [ ] People, Events, Theories, Places, Artifacts
- [ ] Entity Pages (get, update, create, delete)
- [ ] Entity Links (for network graph)
- [ ] Annotations
- [ ] Map Overlays

### 2.3 Replace Supabase Clients
Update frontend to call Tauri commands instead of Supabase:

**Before (Supabase)**:
```javascript
const { data } = await supabase
  .from('sources')
  .select('*')
  .eq('project_id', projectId);
```

**After (Tauri)**:
```javascript
import { invoke } from '@tauri-apps/api/tauri';

const sources = await invoke('get_sources', { projectId });
```

### 2.4 File Conversion
- [ ] Create utility to convert between Supabase paths and local paths
- [ ] Handle file:// URLs for local resources
- [ ] Update PDF viewer to work with local files

---

## Phase 3: Data Migration (Week 3)

### 3.1 Export from Supabase
Create migration script to export all data:

- [ ] Export PostgreSQL data to JSON
- [ ] Download all files from Supabase Storage
- [ ] Create import script for SQLite

**Export Script**:
```bash
# Export database
node scripts/export-supabase.js > data-export.json

# Download storage files
node scripts/download-storage.js
```

### 3.2 Import to Local
- [ ] Create SQL import script
- [ ] Copy files to local directory structure
- [ ] Verify data integrity
- [ ] Test with sample project

### 3.3 Backup Strategy
- [ ] Implement local backup (zip project folder)
- [ ] Add export to JSON feature
- [ ] Document manual backup process

---

## Phase 4: Frontend Updates (Week 3-4)

### 4.1 Replace API Calls
Update all files that use Supabase:

**Files to Update**:
- [ ] `src/lib/supabase.js` → `src/lib/tauri.js`
- [ ] `src/lib/upload.js` → use `invoke('upload_pdf', ...)`
- [ ] `src/lib/entityPages.js` → use `invoke('get_entity_page', ...)`
- [ ] `src/lib/people.js`, `events.js`, etc. → use Tauri commands
- [ ] `src/lib/annotations.js` → local file storage
- [ ] `src/lib/overlays.js` → local image storage
- [ ] `src/App.jsx` → load from SQLite on mount

### 4.2 Remove Supabase Dependencies
- [ ] Uninstall `@supabase/supabase-js`
- [ ] Remove Supabase environment variables
- [ ] Update `.env.example`
- [ ] Clean up unused imports

### 4.3 Update File Handling
- [ ] Use `open` dialog for file selection
- [ ] Handle drag-and-drop for file uploads
- [ ] Show native file paths in UI

**Example**:
```javascript
import { open } from '@tauri-apps/api/dialog';

const selected = await open({
  filters: [{ name: 'PDF', extensions: ['pdf'] }]
});
```

### 4.4 Add Desktop Features
- [ ] Native menu bar (File, Edit, View, Help)
- [ ] Keyboard shortcuts (Cmd+O for open, etc.)
- [ ] System tray icon (optional)
- [ ] Window state persistence (size, position)

---

## Phase 5: Testing & Polish (Week 4)

### 5.1 Feature Parity Checklist
Ensure all current features work:

- [ ] Project creation and switching
- [ ] PDF upload and viewing
- [ ] Annotations (highlight, notes, pins)
- [ ] Map with overlays and pinpoints
- [ ] Entity pages (create, edit, view)
- [ ] Entity Explorer (search, filter)
- [ ] Network graph visualization
- [ ] Tab system (open, close, switch)
- [ ] All entity types (people, events, theories, places, artifacts)

### 5.2 Test Suite
- [ ] Run existing tests (adapt for Tauri)
- [ ] Add integration tests for Tauri commands
- [ ] Test on clean install (no existing data)
- [ ] Test data migration with real data
- [ ] Test file permissions and sandboxing

### 5.3 Performance Testing
- [ ] Test with large PDFs (100+ pages)
- [ ] Test with many files (500+ PDFs)
- [ ] Test database queries with large datasets
- [ ] Optimize slow operations

### 5.4 Error Handling
- [ ] Handle file not found errors gracefully
- [ ] Validate file types on upload
- [ ] Show meaningful error messages
- [ ] Add crash reporting (optional)

---

## Phase 6: Build & Distribution (Week 4-5)

### 6.1 Build Configuration
- [ ] Configure app icon (`.icns` for Mac)
- [ ] Set up code signing (Apple Developer account)
- [ ] Configure auto-updater
- [ ] Optimize bundle size

### 6.2 Create Installer
- [ ] Build `.dmg` for macOS: `npm run tauri build`
- [ ] Test installation on clean Mac
- [ ] Create release notes

### 6.3 Auto-Updater Setup
- [ ] Configure update server (GitHub Releases)
- [ ] Implement update check on app launch
- [ ] Add "Check for Updates" menu item
- [ ] Test update flow

**Auto-Updater Config** (`tauri.conf.json`):
```json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://github.com/dehepting/arcanum/releases/latest/download/latest.json"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

### 6.4 GitHub Actions CI/CD
Create workflow to build on every release:

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run tauri build
      - name: Upload Release
        uses: softprops/action-gh-release@v1
        with:
          files: src-tauri/target/release/bundle/dmg/*.dmg
```

---

## Phase 7: Shutdown Cloud Services (Week 5)

### 7.1 Vercel
- [ ] Archive the deployment
- [ ] Download any logs or analytics
- [ ] Cancel subscription (if any)
- [ ] Update README to note desktop-only

### 7.2 Supabase
- [ ] Export final backup of all data
- [ ] Download all storage files
- [ ] Verify local migration complete
- [ ] Pause or delete project
- [ ] Cancel subscription

### 7.3 Documentation Updates
- [ ] Update README with desktop installation instructions
- [ ] Document local storage structure
- [ ] Add backup/export guide
- [ ] Update development setup docs

---

## Phase 8: Future Enhancements

### 8.1 Optional Cloud Sync (Future)
If needed later, add:
- [ ] Export to cloud (Dropbox, iCloud, etc.)
- [ ] Import from cloud backup
- [ ] Conflict resolution for multi-device sync

### 8.2 Cross-Platform (Future)
- [ ] Build for Windows
- [ ] Build for Linux
- [ ] Test on all platforms

### 8.3 MCP Integration
- [ ] Create MCP server for Arcanum
- [ ] Add tools for entity CRUD
- [ ] Add tools for search and analysis
- [ ] Document MCP usage

---

## Timeline Summary

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Foundation | Tauri app running with SQLite |
| 2 | Backend | All Rust commands implemented |
| 3 | Migration | Supabase data → local SQLite |
| 4 | Frontend | All features working locally |
| 5 | Polish | Desktop app ready to ship |

---

## Risk Mitigation

### Risks & Solutions

**Risk**: Data loss during migration
- **Solution**: Multiple backups, test migration on copy first

**Risk**: Missing Supabase features
- **Solution**: Feature parity checklist, thorough testing

**Risk**: Code signing issues (macOS)
- **Solution**: Apple Developer account ($99/year), follow Tauri docs

**Risk**: Performance issues with large datasets
- **Solution**: SQLite indexes, pagination, lazy loading

**Risk**: Users can't update easily
- **Solution**: Built-in auto-updater, clear release notes

---

## Success Criteria

- [ ] All current features work identically
- [ ] App launches in <2 seconds
- [ ] Can handle 1000+ PDFs smoothly
- [ ] Data migration completes without errors
- [ ] Mac app installs cleanly (no warnings)
- [ ] Auto-updater works
- [ ] Zero cloud costs after shutdown

---

## Next Steps

1. **Review this plan** - Any concerns or changes?
2. **Merge PR #68** - Get sources loading working
3. **Start Phase 1** - Initialize Tauri project
4. **Create branch**: `feature/tauri-migration`

Ready to begin?
