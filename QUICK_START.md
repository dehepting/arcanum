# Arcanum Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
cd arcanum
npm install
```

### 2. Launch the App

**Development Mode** (for coding - auto-reloads on changes):
```bash
npm run tauri:dev
```

**Production Mode** (build and install to /Applications):
```bash
npm run build:install
```

### 3. Set Up Shell Aliases (Recommended)

Add these to your `~/.zshrc` or `~/.bashrc`:

```bash
alias arcanum="cd /Users/davidhepting/arcanum && npm run tauri:dev"
alias arcanum-build="cd /Users/davidhepting/arcanum && npm run build:install"
```

Then reload: `source ~/.zshrc`

Now just type `arcanum` from anywhere to launch!

---

## 📂 Where Your Data Lives

All data is stored locally on your Mac:

```
~/Library/Application Support/com.arcanum.app/
├── arcanum.db                    # SQLite database
└── storage/
    ├── sources/                  # Your PDF files
    ├── artifacts/                # Artifact images
    ├── map-overlays/             # Historic map overlays
    └── entity-pages/             # Entity page content
```

---

## 🎯 Basic Workflow

### Create a Project
1. Launch Arcanum
2. Click "New Project"
3. Enter project name and description

### Add a PDF
1. Click "Upload PDF" or drag and drop
2. PDF opens in a new tab
3. Start annotating!

### Annotate Documents
- **Highlight**: Select text → Choose highlight tool
- **Draw**: Click ink tool → Draw on PDF
- **Notes**: Double-click anywhere → Add text note
- **Link to Map**: Create annotation → Click 📍 → Place on map

### Create Entities
1. Click "+" in sidebar
2. Choose type: Person, Place, Event, Theory, or Artifact
3. Fill in details
4. Link to annotations or map pins

### Add Map Overlays
1. Navigate to map view
2. Click "Add Overlay"
3. Upload historic map image
4. Adjust opacity and position

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + N` | New project |
| `Cmd + O` | Open PDF |
| `Cmd + W` | Close current tab |
| `Cmd + T` | New tab |
| `Cmd + ,` | Settings |
| `Cmd + Q` | Quit |

---

## 🐛 Troubleshooting

### App Won't Launch
```bash
# Check for build errors
npm run tauri:dev

# Rebuild from scratch
rm -rf src-tauri/target
npm run tauri:build
```

### Database Issues
The database is at `~/Library/Application Support/com.arcanum.app/arcanum.db`

To reset (⚠️ deletes all data):
```bash
rm -rf ~/Library/Application\ Support/com.arcanum.app/
```

### Files Not Loading
Copy files to app storage directory:
```bash
cp -r storage/* ~/Library/Application\ Support/com.arcanum.app/storage/
```

---

## 📖 Next Steps

- **Full Documentation**: See [README.md](./README.md)
- **Migration Guide**: See [TAURI_MIGRATION_PLAN.md](./TAURI_MIGRATION_PLAN.md) (historical)
- **Development**: See [SETUP.md](./SETUP.md)

---

## 🎓 Example: Research Workflow

1. **Upload primary source** (e.g., archaeological report PDF)
2. **Highlight key passages** about artifact discoveries
3. **Create place entities** for findspots
4. **Link highlights to map pins** at findspot locations
5. **Create artifact entries** with photos and descriptions
6. **Link artifacts to source annotations** for provenance
7. **Upload historic maps** as overlays for context
8. **Build entity pages** with notes and connections

Result: A rich, interconnected research database linking sources, places, artifacts, and evidence.

---

**Status**: Desktop app ready to use
**Platform**: macOS (Apple Silicon + Intel)
**Dependencies**: None (fully local)
**Cost**: $0/month (no cloud services)
