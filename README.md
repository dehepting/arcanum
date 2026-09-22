# Arcanum

> **collige et serva** — gather and preserve

A dark, scholarly research workspace for hunting ancient treasure, antiquities, and art. Open PDFs and scans as tabs, annotate them with ink and notes, and link those marks to pins on a map. Drop historic map images onto the basemap and keep records of artifacts with findspots.

## Vision

Arcanum is a desktop-style research IDE for archaeological and historical investigation. Unlike notes apps, the **source page** and the **map** are first-class citizens. Built for deep research into lost civilizations, buried treasure, and art scattered across museums and private collections worldwide.

## Features (v1)

- 🗺️ **Map-first workspace** with split view (PDF | Map)
- 📄 **Multi-tab PDF viewer** with non-destructive overlay annotations
- 🖍️ **Annotation tools**: Highlight, ink drawing, text notes
- 📍 **Link annotations to map pins** for geographic context
- 🏺 **Artifact catalog** with findspot locations
- 🗺️ **Historic map overlays** with opacity and transform controls
- 💾 **Local-first storage** with SQLite (your data stays on your machine)
- 🌙 **Dark scholarly theme** optimized for long research sessions

## Tech Stack

- **Frontend**: Vite + React
- **Map**: MapLibre GL (OpenStreetMap tiles)
- **PDF**: PDF.js
- **Backend**: Tauri (Rust) + SQLite
- **State**: Zustand

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url> arcanum
cd arcanum
npm install
```

### 2. Run in development mode

```bash
npm run tauri:dev
```

The app will launch with a local SQLite database at `~/Library/Application Support/com.arcanum.app/`

### 3. Build for production

```bash
npm run tauri:build
```

This creates a `.dmg` installer in `src-tauri/target/release/bundle/dmg/`

## Data Storage

- **Database**: `~/Library/Application Support/com.arcanum.app/arcanum.db`
- **Files**: `~/Library/Application Support/com.arcanum.app/storage/`
  - `storage/sources/` - PDF documents
  - `storage/artifacts/` - Artifact images
  - `storage/map-overlays/` - Historic map overlays
  - `storage/entity-pages/` - Entity page markdown files

## Migrating from Supabase

If you have data in the old Supabase version:

1. Export data: `cd src-tauri/migration && node export-from-supabase.js`
2. Download files: `node download-files.js`
3. Initialize database: `node init-database.js`
4. Import data: `node import-to-sqlite.js`

## Roadmap

### v1.0 (Current)
- [x] Project structure
- [x] Local SQLite database
- [x] Tauri desktop app
- [x] PDF upload and tabbed viewer
- [x] Annotation overlay (highlight, ink, text)
- [x] Map pins with link to annotations
- [x] Basic artifact catalog
- [x] Historic map overlay with opacity control

### v1.1
- [ ] Georeferencing UI for historic maps
- [ ] Full-text search across PDFs
- [ ] Export reports

### v2.0
- [ ] MCP server for Claude integration
- [ ] AI-assisted research and connections
- [ ] Cloud sync (optional)
- [ ] Version control for annotations

## Demo Corpus

The project includes Ignatius Donnelly's *Atlantis: The Antediluvian World* (1882) as a demo corpus — a public domain text perfect for testing geographic research workflows.

## License

MIT

## Contributing

This is a personal research tool, but PRs are welcome! Please open an issue first to discuss major changes.

---

Built with curiosity and caffeine. 🗺️

## CI/CD Pipeline

This project uses automated quality controls:
- Pre-commit hooks (Husky + lint-staged)
- GitHub Actions CI (lint + build + security audit)
- Dependabot (automated dependency updates)
- Branch protection (requires CI to pass)
