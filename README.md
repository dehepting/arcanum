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

## Quick Start

### Installation

```bash
git clone https://github.com/dehepting/arcanum.git
cd arcanum
npm install
```

### Development Workflow

The easiest way to run Arcanum is with shell aliases. Add to your `~/.zshrc` (or `~/.bashrc`):

```bash
alias arcanum="cd /path/to/arcanum && npm run tauri:dev"
alias arcanum-build="cd /path/to/arcanum && npm run build:install"
```

Then reload your shell: `source ~/.zshrc`

Now you can:
- **`arcanum`** - Launch development mode with auto-reload (for coding)
- **`arcanum-build`** - Build and install production app to /Applications

### Manual Commands

If you prefer not to use aliases:

```bash
# Development mode (auto-reload on code changes)
npm run tauri:dev

# Production build + install
npm run build:install

# Just build (creates .dmg in src-tauri/target/release/bundle/dmg/)
npm run tauri:build
```

## Data Storage

- **Database**: `~/Library/Application Support/com.arcanum.app/arcanum.db`
- **Files**: `~/Library/Application Support/com.arcanum.app/storage/`
  - `storage/sources/` - PDF documents
  - `storage/artifacts/` - Artifact images
  - `storage/map-overlays/` - Historic map overlays
  - `storage/entity-pages/` - Entity page markdown files

## Architecture

Arcanum is a **local-first desktop application** built with:
- **Rust backend** (Tauri) for native performance
- **SQLite database** for fast, reliable local storage
- **React frontend** for rich UI
- **MapLibre GL** for interactive mapping
- **PDF.js** for document viewing

All data stays on your machine - no cloud dependencies, no monthly costs.

## Roadmap

### ✅ v1.0 - Desktop Foundation (Complete)
- [x] Tauri desktop app architecture
- [x] Local SQLite database with hybrid storage
- [x] PDF upload and tabbed viewer
- [x] Annotation overlay (highlight, ink, text notes)
- [x] Map pins with link to annotations
- [x] Entity system (people, places, events, theories, artifacts)
- [x] Entity pages with rich text editor
- [x] Historic map overlays with opacity control
- [x] Artifact-source linking
- [x] Migration from Supabase to local-first
- [x] Automated GitHub releases

### v1.1 - Enhanced Features (In Progress)
- [ ] Georeferencing UI for historic maps
- [ ] Full-text search across PDFs and entity pages
- [ ] Network graph visualization improvements
- [ ] Timeline visualization for chronological events
- [ ] Advanced search and filtering
- [ ] Export reports (PDF, Markdown)

### v2.0 - AI Integration (Planned)
- [ ] MCP server for Claude integration
- [ ] AI-assisted entity extraction from PDFs
- [ ] Automated relationship discovery
- [ ] Smart search and connections
- [ ] Cloud sync (optional)
- [ ] Cross-platform (Windows, Linux)

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
