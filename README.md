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
- 💾 **Cloud storage** via Supabase (access from anywhere)
- 🌙 **Dark scholarly theme** optimized for long research sessions

## Tech Stack

- **Frontend**: Vite + React
- **Map**: MapLibre GL (OpenStreetMap tiles)
- **PDF**: PDF.js
- **Backend**: Supabase (Postgres + Storage)
- **Deployment**: Vercel
- **State**: Zustand

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url> arcanum
cd arcanum
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `docs/database-schema.sql` in the Supabase SQL Editor
3. Create three storage buckets:
   - `sources` (for PDFs)
   - `map-overlays` (for historic maps)
   - `artifact-images` (for artifact photos)
4. Make all buckets **public** (Settings → Storage → bucket → Make public)

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables (same as `.env`)
4. Deploy

Vercel will auto-deploy on every push to `main`.

## Roadmap

### v1.0 (Current)
- [x] Project structure
- [x] Supabase schema
- [ ] PDF upload and tabbed viewer
- [ ] Annotation overlay (highlight, ink, text)
- [ ] Map pins with link to annotations
- [ ] Basic artifact catalog
- [ ] Historic map overlay with opacity control

### v1.1
- [ ] Georeferencing UI for historic maps
- [ ] Full-text search across PDFs
- [ ] Export reports

### v2.0
- [ ] MCP server for Claude integration
- [ ] AI-assisted research and connections
- [ ] Collaboration features
- [ ] Version control for annotations

## Demo Corpus

The project includes Ignatius Donnelly's *Atlantis: The Antediluvian World* (1882) as a demo corpus — a public domain text perfect for testing geographic research workflows.

## License

MIT

## Contributing

This is a personal research tool, but PRs are welcome! Please open an issue first to discuss major changes.

---

Built with curiosity and caffeine. 🗺️
