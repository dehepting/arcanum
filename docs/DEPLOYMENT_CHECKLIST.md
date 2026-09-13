# Phase 3 Deployment Checklist

## Pre-Deployment

### 1. File Verification ✅
Ensure all files are present:

**New Files:**
- [x] `src/lib/artifact-sources.js` (6.4 KB)
- [x] `src/components/ArtifactBadge.jsx` (4.0 KB)
- [x] `src/components/ArtifactLinkModal.jsx` (11.6 KB)
- [x] `src/components/ArtifactSourcesList.jsx` (8.5 KB)
- [x] `docs/artifact-source-links-schema.sql` (2.1 KB)
- [x] `docs/PHASE3_IMPLEMENTATION_SUMMARY.md`
- [x] `docs/verify-phase3.md`
- [x] `docs/artifact-source-links-api.md`

**Modified Files:**
- [x] `src/components/AnnotationModal.jsx` (8.5 KB)
- [x] `src/components/AnnotationOverlay.jsx` (10.0 KB)
- [x] `src/components/ArtifactDetail.jsx` (13.9 KB)

### 2. Code Review
Run these checks before deploying:

```bash
# Check for syntax errors (if using ESLint)
npm run lint

# Check for TypeScript errors (if applicable)
npm run type-check

# Run tests (if any)
npm test
```

### 3. Database Migration

**CRITICAL: Must be done before deploying code!**

1. Log into Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `docs/artifact-source-links-schema.sql`
4. Paste and execute the SQL
5. Verify table created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_name = 'artifact_source_links';
   ```

6. Verify indexes created:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'artifact_source_links';
   ```

7. Verify RLS is disabled (matches other tables):
   ```sql
   SELECT relname, relrowsecurity FROM pg_class
   WHERE relname = 'artifact_source_links';
   ```

Expected: `relrowsecurity = f` (false)

---

## Deployment Steps

### Step 1: Commit Changes

```bash
cd /Users/davidhepting/arcanum

# Check status
git status

# Add all new and modified files
git add src/lib/artifact-sources.js
git add src/components/ArtifactBadge.jsx
git add src/components/ArtifactLinkModal.jsx
git add src/components/ArtifactSourcesList.jsx
git add src/components/AnnotationModal.jsx
git add src/components/AnnotationOverlay.jsx
git add src/components/ArtifactDetail.jsx
git add docs/artifact-source-links-schema.sql
git add docs/PHASE3_IMPLEMENTATION_SUMMARY.md
git add docs/verify-phase3.md
git add docs/artifact-source-links-api.md
git add docs/DEPLOYMENT_CHECKLIST.md

# Commit
git commit -m "Implement Phase 3: Source-Artifact Linking

Features:
- Bidirectional linking between artifacts and PDF annotations
- ArtifactBadge component for annotation overlays
- ArtifactLinkModal for creating/selecting artifact links
- ArtifactSourcesList showing all references for an artifact
- Sources tab in ArtifactDetail view
- 'Link to Artifact' button in AnnotationModal
- Visual badges on linked annotations

Database:
- New artifact_source_links junction table
- RLS policies for project-based access
- Cascade delete on artifact/annotation removal

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Step 2: Deploy to Development

```bash
# Push to development branch
git push origin development

# Or if using main branch:
# git push origin main
```

### Step 3: Monitor Deployment

Watch for:
- Build errors
- Runtime errors in browser console
- Database connection issues
- RLS policy violations

### Step 4: Smoke Test

Once deployed, run quick smoke test:

1. **Navigate to app** → Should load without errors
2. **Open PDF** → Annotations should render
3. **Create annotation** → Modal should open
4. **Check for "Link to Artifact" button** → Should be visible
5. **Open artifact** → Should have "Sources" tab

---

## Post-Deployment Verification

### Automated Checks

```bash
# Check for console errors
# Open browser console (F12) and look for red errors

# Check network tab for failed requests
# Open Network tab, filter by "Fetch/XHR", look for 4xx/5xx errors
```

### Manual Testing

Follow the guide in `docs/verify-phase3.md`:

**Test 1: Link Existing Artifact** (5 min)
- [ ] Create annotation on PDF
- [ ] Click "Link to Artifact"
- [ ] Select artifact from list
- [ ] Badge appears on annotation
- [ ] Artifact shows source in Sources tab

**Test 2: Create New Artifact** (5 min)
- [ ] Create annotation with text
- [ ] Choose "Create New Artifact"
- [ ] Form pre-fills with quote
- [ ] Save creates artifact + link

**Test 3: Sources Tab** (3 min)
- [ ] Open artifact with links
- [ ] Sources tab shows references
- [ ] "View in PDF" navigates correctly
- [ ] "Unlink" removes reference

**Test 4: Badge Interaction** (2 min)
- [ ] Badge appears on linked annotations
- [ ] Hover shows preview
- [ ] Click opens artifact detail

### Database Verification

```sql
-- Check links are being created
SELECT COUNT(*) FROM artifact_source_links;

-- Check cascade deletes work
-- (Delete a test annotation, verify link removed)
```

---

## Rollback Plan

If critical issues found:

### Quick Rollback (Code Only)

```bash
# Revert to previous commit
git revert HEAD
git push origin [branch]
```

### Full Rollback (Code + Database)

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_artifact_source_links_artifact;
DROP INDEX IF EXISTS idx_artifact_source_links_annotation;

-- Drop table (CAUTION: This deletes all data!)
DROP TABLE IF EXISTS artifact_source_links;
```

Then revert code:
```bash
git revert HEAD
git push origin [branch]
```

---

## Common Issues & Solutions

### Issue: "Link to Artifact" button not showing
**Solution:** Button only shows for existing (saved) annotations. New annotations must be saved first.

### Issue: Badge not appearing after linking
**Check:**
1. Browser console for errors
2. Link was created: `SELECT * FROM artifact_source_links WHERE annotation_id = '...'`
3. Page refresh may be needed

### Issue: Foreign key constraint errors
**Solution:**
Verify artifact and annotation exist before linking:
```sql
SELECT id FROM artifacts WHERE id = 'artifact-uuid';
SELECT id FROM annotations WHERE id = 'annotation-uuid';
```

### Issue: Sources tab is empty but links exist
**Check:**
1. RLS policies applied correctly
2. User is member of the project
3. Browser console for API errors

### Issue: Performance degradation
**Check:**
1. Indexes are present: `\d artifact_source_links` in psql
2. Query performance: `EXPLAIN ANALYZE SELECT ...`
3. Consider adding caching if needed

---

## Performance Baseline

Expected performance after deployment:

- **Link creation:** < 100ms
- **Load sources for artifact:** < 200ms (with 10 sources)
- **Badge render:** < 50ms
- **Sources tab load:** < 300ms

If exceeding these, investigate:
1. Database query optimization
2. Index usage
3. Network latency
4. RLS policy complexity

---

## Monitoring

### Metrics to Track

1. **Link creation rate** - How many links created per day
2. **Error rate** - Failed link operations
3. **Page load time** - Impact on overall app performance
4. **Database query time** - artifact_source_links queries

### Alerts to Set Up

- [ ] Database errors involving artifact_source_links
- [ ] RLS policy violations
- [ ] Cascade delete failures
- [ ] Performance degradation > 500ms

---

## Documentation Updates

After successful deployment:

- [ ] Update main README with Phase 3 features
- [ ] Add screenshots to documentation
- [ ] Update user guide with artifact linking workflow
- [ ] Create video tutorial (optional)

---

## Next Steps

After Phase 3 is stable:

1. **MCP Server Development** (Phase 4)
   - Tools for artifact CRUD operations
   - Integration with external museum APIs
   - Bulk import capabilities

2. **Atlantis Demo Project** (Phase 5)
   - Populate with mythological artifacts
   - Create sample PDFs with references
   - Full workflow testing

3. **Future Enhancements**
   - Advanced search & filters
   - Collections & sets
   - Export functionality
   - Statistics dashboard

---

## Sign-Off

**Deployed by:** _________________

**Date:** _________________

**Environment:** [ ] Development [ ] Staging [ ] Production

**Database Migration Applied:** [ ] Yes [ ] No

**Tests Passed:** [ ] All [ ] Partial [ ] None

**Issues Found:** _________________

**Status:** [ ] Success [ ] Success with issues [ ] Failed

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
