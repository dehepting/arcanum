# GitHub Issues Template

Once you push to GitHub, create these issues to track v1 development:

## Issue #1: PDF Upload and Storage

**Title:** Implement PDF upload to Supabase Storage

**Description:**
- Add file input for PDF upload
- Upload file to Supabase `sources` bucket
- Save source record to database with project_id and file_url
- Display uploaded PDF in new tab
- Handle errors and loading states

**Acceptance Criteria:**
- [ ] User can click "+ PDF" and select a file
- [ ] File uploads to Supabase Storage
- [ ] New tab appears with PDF title
- [ ] PDF renders in viewer when tab is clicked

---

## Issue #2: Annotation Overlay System

**Title:** Build annotation overlay for PDF pages

**Description:**
Implement highlight, ink, and text annotation tools on PDF pages. Annotations should be stored as overlays (non-destructive) and saved to Supabase.

**Tasks:**
- [ ] Add mouse drag to create highlight rectangles
- [ ] Save highlight coordinates (normalized 0-1) to database
- [ ] Render highlights as translucent overlays on current page
- [ ] Add ink drawing tool with Fabric.js or SVG paths
- [ ] Add text annotation tool
- [ ] Edit/delete annotations

**Reference:** See `~/hunt-ide/app.js` lines 239-291 for overlay drag implementation

---

## Issue #3: Link Annotations to Map Pins

**Title:** Create bidirectional links between PDF annotations and map pins

**Description:**
- Allow user to select an annotation and click map to drop a pin
- Store link in `annotation_place_links` table
- Show linked annotations in sidebar
- Click annotation → fly to map pin
- Click pin → jump to source page with annotation

**Acceptance Criteria:**
- [ ] "Send to map" button on annotation modal
- [ ] Map click creates pin and links to selected annotation
- [ ] Sidebar shows linked annotations with place names
- [ ] Clicking link navigates between source and map

---

## Issue #4: Map Pin Management

**Title:** CRUD operations for map pins

**Description:**
- Create pins by clicking map
- Edit pin name and note
- Delete pins
- Show pin tooltips/popups on hover/click
- Visual distinction for linked vs unlinked pins

---

## Issue #5: Historic Map Overlay Upload

**Title:** Add historic map image overlays to basemap

**Description:**
- Upload historic map images to `map-overlays` bucket
- Add as layer on MapLibre map
- Control opacity with slider
- Control rotation (basic transform)
- Save overlay settings to database

---

## Issue #6: Artifact Catalog CRUD

**Title:** Build artifact catalog with sidebar interface

**Description:**
- Add/edit/delete artifact records
- Fields: title, description, location, coordinates, period, material, museum
- Click artifact → fly to findspot on map
- Upload artifact thumbnail image

---

## Issue #7: Search Within PDFs

**Title:** Full-text search across PDF sources

**Description:**
- Extract text from PDFs using PDF.js getTextContent()
- Index text in frontend or store in database
- Search UI in toolbar
- Highlight search results on page
- Navigate between results

---

## Issue #8: Georeferencing UI

**Title:** Interactive georeferencing for historic map overlays

**Description:**
- Click corners on historic map overlay
- Click corresponding real-world points on basemap
- Calculate transform matrix
- Apply transform to overlay
- Save corner coordinates to database

This is a v1.1 feature but document the design now.

---

## Issue #9: Demo Project Setup

**Title:** Create demo project with Donnelly's Atlantis

**Description:**
- Upload Donnelly 1882 Atlantis PDF to demo project
- Add seed data: 3-5 pre-annotated passages
- Add seed pins: Pillars of Hercules, Azores, Santorini
- Add 1-2 historic map overlays
- Include setup instructions in README

---

## Issue #10: Mobile Responsiveness

**Title:** Make layout responsive for tablet/mobile

**Description:**
- Stack sidebar below on mobile
- Adjust toolbar for small screens
- Touch-friendly annotation tools
- Test on iPad and iPhone

---

## Labels to Create

- `enhancement` (new features)
- `bug` (fixes)
- `documentation` (docs and guides)
- `v1.0` (milestone)
- `v1.1` (future milestone)
- `good first issue` (for contributors)
