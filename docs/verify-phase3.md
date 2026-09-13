# Phase 3 Verification Guide

## Quick Start

### 1. Apply Database Schema

```sql
-- Copy and run this in Supabase SQL Editor
-- File: docs/artifact-source-links-schema.sql
```

Open Supabase dashboard → SQL Editor → Paste the contents of `artifact-source-links-schema.sql` → Run.

### 2. Verify Table Creation

```sql
-- Check table exists
SELECT * FROM artifact_source_links LIMIT 1;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'artifact_source_links';

-- Expected: idx_artifact_source_links_artifact, idx_artifact_source_links_annotation

-- Verify RLS is disabled (should match other tables)
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'artifact_source_links';
-- Expected: relrowsecurity = f (false)
```

### 3. Test in Application

#### Test 1: Link Existing Artifact
1. Start the app: `npm run dev`
2. Open a PDF with highlights/annotations
3. Click on an annotation to open modal
4. Should see "🔗 Link to Artifact" button
5. Click it → Modal opens with artifact list
6. Select an artifact → Click "Link Artifact"
7. ✅ Badge should appear on annotation
8. ✅ Open artifact → Sources tab should show the PDF reference

#### Test 2: Create New Artifact
1. Create a new highlight on PDF text mentioning an artifact
2. Open annotation modal
3. Click "🔗 Link to Artifact"
4. Select "Create New Artifact" radio button
5. ✅ Form should open with quote pre-filled
6. Fill in artifact name and other details
7. Save
8. ✅ Artifact created and linked automatically

#### Test 3: Sources Tab
1. Find an artifact that has linked sources
2. Open artifact detail
3. Click "Sources" tab (4th tab)
4. ✅ Should see list of all linked PDF references
5. Click "View in PDF"
6. ✅ Should jump to the correct PDF page
7. Click "Unlink"
8. ✅ Source should be removed from list
9. ✅ Badge should disappear from annotation

#### Test 4: Badge Interaction
1. View PDF with artifact-linked annotations
2. ✅ Annotations should have purple border + badge icon
3. Hover over badge
4. ✅ Should see artifact preview popup
5. Click badge
6. ✅ Should open artifact detail in sidebar

## Visual Verification

### Annotation Styles
- **Not linked:** Orange border
- **Linked to place:** Orange border + 📍 pin badge
- **Linked to artifact:** Purple border + 🏺 artifact badge

### Sources Tab
Should show:
- PDF icon and title
- Page number badge
- Quote in gray box with left border
- Context text (if provided)
- "View in PDF" and "Unlink" buttons
- Date linked

### Badge Preview
On hover, should display:
- Artifact emoji + name
- Category badge
- Description preview
- "Click to view artifact details" hint

## Browser Console Checks

### No Errors Expected
Open browser console (F12) → Should see no errors related to:
- artifact-sources.js functions
- ArtifactLinkModal rendering
- ArtifactBadge rendering
- ArtifactSourcesList data loading

### Expected Console Logs
```
Opening modal with annotation: {id: "...", ...}
```

### Check Network Tab
When linking artifact:
- POST request to `artifact_source_links` table
- Should return 201 Created
- Response should include the link ID

## Database Verification Queries

### Check Links Created
```sql
SELECT
  asl.*,
  a.name as artifact_name,
  ann.text as annotation_text
FROM artifact_source_links asl
JOIN artifacts a ON a.id = asl.artifact_id
JOIN annotations ann ON ann.id = asl.annotation_id
ORDER BY asl.created_at DESC
LIMIT 10;
```

### Count Links Per Artifact
```sql
SELECT
  a.name,
  COUNT(asl.id) as source_count
FROM artifacts a
LEFT JOIN artifact_source_links asl ON asl.artifact_id = a.id
GROUP BY a.id, a.name
HAVING COUNT(asl.id) > 0
ORDER BY source_count DESC;
```

### Count Links Per Source
```sql
SELECT
  s.title,
  COUNT(DISTINCT asl.artifact_id) as artifact_count
FROM sources s
JOIN annotations ann ON ann.source_id = s.id
JOIN artifact_source_links asl ON asl.annotation_id = ann.id
GROUP BY s.id, s.title
ORDER BY artifact_count DESC;
```

## Troubleshooting

### Badge Not Appearing
**Issue:** Annotation created but no badge shows
**Check:**
1. Open browser console for errors
2. Check if link was saved: `SELECT * FROM artifact_source_links WHERE annotation_id = '...'`
3. Verify AnnotationOverlay is loading artifact links
4. Check that annotation and artifact are on same project

### Link Button Not Showing
**Issue:** Modal opens but no "Link to Artifact" button
**Check:**
1. Is this an existing annotation (has an ID)?
2. Button only shows for saved annotations
3. New annotations must be saved first

### Sources Tab Empty
**Issue:** Sources tab shows "No Source References" but links exist
**Check:**
1. Browser console for errors in ArtifactSourcesList
2. Run query: `SELECT * FROM artifact_source_links WHERE artifact_id = '...'`
3. Verify the artifact_id is correct
4. Check foreign key relationships are intact

### "View in PDF" Not Working
**Issue:** Click "View in PDF" but nothing happens
**Check:**
1. Is the source (PDF) still in the project?
2. Check browser console for errors
3. Verify setMapView, setActiveSource, setCurrentPage are defined in store

### Foreign Key Errors
**Issue:** Error when creating links
**Check:**
1. Artifact exists: `SELECT * FROM artifacts WHERE id = '...'`
2. Annotation exists: `SELECT * FROM annotations WHERE id = '...'`
3. Both records are not soft-deleted

## Performance Tests

### Load Time
- Opening artifact with 10+ sources → Should load in < 500ms
- Badge preview on hover → Should appear instantly
- Switching to Sources tab → Should render in < 300ms

### Database Performance
```sql
-- Should use index (check EXPLAIN output)
EXPLAIN ANALYZE
SELECT * FROM artifact_source_links
WHERE artifact_id = 'some-uuid';

-- Should see: "Index Scan using idx_artifact_source_links_artifact"
```

## Success Criteria

✅ Database schema applied without errors
✅ All 4 user workflows working end-to-end
✅ Badges appear on linked annotations
✅ Sources tab shows all references correctly
✅ Navigation works bidirectionally (PDF ↔ Artifact)
✅ No console errors or warnings
✅ RLS policies enforced correctly
✅ Cascade deletes working
✅ Performance acceptable (< 500ms for all operations)

## Clean Up Test Data

```sql
-- Remove all test links (if needed)
DELETE FROM artifact_source_links WHERE quote LIKE '%test%';

-- Or remove all links for a specific artifact
DELETE FROM artifact_source_links WHERE artifact_id = 'some-uuid';
```

## Report Issues

If you encounter bugs or unexpected behavior:

1. **Browser console screenshot** showing errors
2. **Network tab** showing failed requests
3. **Database query** showing unexpected data state
4. **Steps to reproduce** the issue

Add to GitHub issues or project documentation.
