# Phase 3 Quick Start Guide

## 🎯 Goal
Enable linking between artifacts and their mentions in PDF source documents.

## ⚡ 5-Minute Deploy

### 1. Database (REQUIRED FIRST!)
```sql
-- In Supabase SQL Editor, run:
-- Copy/paste from: docs/artifact-source-links-schema.sql
```

### 2. Verify
```bash
npm run dev
# Open app, create annotation, look for "Link to Artifact" button
```

### 3. Done!
All features automatically available.

---

## 📖 Quick Reference

### User Workflows

**Link existing artifact:**
Annotation → "Link to Artifact" → Select → Done

**Create from PDF:**
Annotation → "Link to Artifact" → "Create New" → Fill form → Save

**View sources:**
Artifact detail → "Sources" tab → See all references

**Navigate:**
Badge on annotation → Click → Opens artifact detail

### Visual Indicators

| Appearance | Meaning |
|------------|---------|
| Orange border | Regular annotation |
| Orange + 📍 | Linked to map place |
| Purple + 🏺 | Linked to artifact |

### Key Files

```
docs/artifact-source-links-schema.sql    ← Database migration
src/lib/artifact-sources.js              ← API functions
src/components/ArtifactLinkModal.jsx     ← Link UI
```

### API Usage

```javascript
import { linkArtifactToAnnotation } from '../lib/artifact-sources';

const result = await linkArtifactToAnnotation(
  artifactId,
  annotationId,
  'Quote from PDF...',
  'Optional context'
);
```

---

## 🐛 Troubleshooting

**Button not showing?**
→ Annotation must be saved first (has an ID)

**Badge not appearing?**
→ Refresh page, check browser console

**Sources tab empty?**
→ Check RLS policies applied, user has project access

**Permission denied?**
→ User must be member of artifact's project

---

## 📚 Full Documentation

- **PHASE3_COMPLETE.md** - Complete overview
- **docs/verify-phase3.md** - Testing procedures
- **docs/artifact-source-links-api.md** - Developer API
- **docs/DEPLOYMENT_CHECKLIST.md** - Deploy guide

---

## ✅ Checklist

- [ ] Applied database schema
- [ ] Tested link creation
- [ ] Tested artifact creation from PDF
- [ ] Verified Sources tab works
- [ ] Checked badge interaction
- [ ] No console errors
- [ ] Ready to commit!

---

**Status:** Ready for deployment
**Time to deploy:** 5-15 minutes
**Breaking changes:** None
**Dependencies:** Supabase database migration only
