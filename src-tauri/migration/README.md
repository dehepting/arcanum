# Supabase to SQLite Migration

This directory contains scripts to migrate data from Supabase to local SQLite.

## Prerequisites

1. Node.js installed
2. Supabase credentials in `../../.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Migration Steps

### Step 1: Export Data from Supabase

Export all database records to JSON files:

```bash
cd src-tauri/migration
node export-from-supabase.js
```

This creates a `data/` directory with JSON files for each table:
- `projects.json`
- `artifacts.json`
- `places.json`
- `people.json`
- `events.json`
- `theories.json`
- `entity_pages.json`
- `sources.json`
- etc.

### Step 2: Download Files from Storage

Download all files from Supabase Storage buckets:

```bash
node download-files.js
```

This creates a `files/` directory with all files organized by bucket:
- `files/artifacts/` - Artifact images
- `files/sources/` - PDF documents
- `files/map-overlays/` - Map overlay images
- `files/entity-pages/` - Markdown files

### Step 3: Import Data to SQLite

After exporting, use the Tauri app to import:

```bash
# In the main Tauri app (once Phase 4 frontend is complete)
# There will be a migration UI or command to import the data
```

Or use the import command directly:

```rust
// Create import Tauri commands in Phase 3
```

## Directory Structure

```
migration/
├── README.md                    # This file
├── export-from-supabase.js     # Export DB data to JSON
├── download-files.js           # Download Storage files
├── import-to-sqlite.js         # Import JSON to SQLite (TODO)
├── verify-migration.js         # Verify data integrity (TODO)
├── data/                       # Exported JSON data
│   ├── projects.json
│   ├── artifacts.json
│   └── ...
└── files/                      # Downloaded files
    ├── artifacts/
    ├── sources/
    ├── map-overlays/
    └── entity-pages/
```

## Safety Notes

- **Backup First**: The export is read-only, but always backup before migration
- **Test First**: Test with a small dataset before full migration
- **Verify**: Use verification script to ensure data integrity
- **Keep Supabase Running**: Don't delete Supabase until Phase 7

## Troubleshooting

### Missing credentials
```
Error: Missing Supabase credentials
```
→ Add credentials to `../../.env`

### Network errors
```
Error exporting table: network timeout
```
→ Check internet connection, retry

### File download failures
```
✗ Error downloading file
```
→ Check file permissions, retry specific bucket

## Next Steps

After migration completes:
1. Verify data with `verify-migration.js`
2. Test app functionality
3. Proceed to Phase 4: Frontend Migration
