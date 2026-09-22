# Entity Pages System

## Overview

Entity Pages provide a hybrid storage solution for rich content associated with entities (people, events, theories, places, artifacts). Metadata is stored in the database for fast querying, while content is stored as markdown files in Supabase Storage for cost efficiency.

## Architecture

```
┌─────────────────────────────────────────────┐
│           Entity Pages System               │
├─────────────────┬───────────────────────────┤
│   Database      │   Supabase Storage        │
│                 │                           │
│  entity_pages   │   entity-pages bucket     │
│  - id           │   {project_id}/           │
│  - entity_id    │     entities/             │
│  - title        │       {type}/             │
│  - storage_path │         {id}.md           │
│  - metadata     │                           │
│  - timestamps   │   Markdown content        │
└─────────────────┴───────────────────────────┘
```

## Database Schema

### `entity_pages` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Reference to project |
| `entity_id` | UUID | Entity identifier (unique) |
| `entity_type` | TEXT | 'person', 'event', 'theory', 'place', 'artifact' |
| `title` | TEXT | Page title (usually entity name) |
| `storage_path` | TEXT | Path to .md file in storage |
| `metadata` | JSONB | Tags, custom fields |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- `idx_entity_pages_entity` on `entity_id`
- `idx_entity_pages_project` on `project_id`
- `idx_entity_pages_type` on `entity_type`
- `idx_entity_pages_metadata` (GIN) on `metadata`
- `idx_entity_pages_unique_entity` (UNIQUE) on `entity_id`

### `entity_links` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | Reference to project |
| `from_entity_id` | UUID | Source entity |
| `from_entity_type` | TEXT | Source entity type |
| `to_entity_id` | UUID | Target entity |
| `to_entity_type` | TEXT | Target entity type |
| `relationship_type` | TEXT | Type of relationship |
| `verified` | BOOLEAN | Is relationship verified? |
| `notes` | TEXT | Additional context |
| `created_at` | TIMESTAMP | Creation time |

## Storage Structure

```
entity-pages/
  {project-id}/
    entities/
      person/
        {entity-id}.md
      event/
        {entity-id}.md
      theory/
        {entity-id}.md
      place/
        {entity-id}.md
      artifact/
        {entity-id}.md
```

## Usage

### Create an Entity Page

```javascript
import { createEntityPage } from '@/lib/entityPages';

const { data, error } = await createEntityPage(
  projectId,
  entityId,
  'person', // entity type
  'Aristotle', // title
  '# Aristotle\n\nGreek philosopher...', // markdown content
  { tags: ['philosophy', 'ancient greece'] } // metadata
);
```

### Get an Entity Page

```javascript
import { getEntityPage } from '@/lib/entityPages';

const { data, error } = await getEntityPage(entityId);

// Returns:
// {
//   page: { id, title, entity_type, metadata, ... },
//   content: "# Aristotle\n\nGreek philosopher..."
// }
```

### Update Content

```javascript
import { updateEntityPage } from '@/lib/entityPages';

// Replace content
await updateEntityPage(entityId, '# New Content');

// Append content
await updateEntityPage(
  entityId,
  '\n\n## New Section\n\nAdditional info...',
  true // append mode
);
```

### Search Entity Pages

```javascript
import { searchEntityPages } from '@/lib/entityPages';

const { data, error } = await searchEntityPages(
  projectId,
  'Aristotle', // search query (searches title)
  ['person', 'event'] // filter by types (optional)
);
```

### Create Entity Link

```javascript
import { createEntityLink } from '@/lib/entityPages';

await createEntityLink(
  projectId,
  aristotleId,
  'person',
  atlantisTheoryId,
  'theory',
  'mentions', // relationship type
  true, // verified
  'Aristotle mentioned Atlantis in Critias' // notes
);
```

### Get Entity Links

```javascript
import { getEntityLinks } from '@/lib/entityPages';

const { data, error } = await getEntityLinks(entityId);

// Returns:
// {
//   outgoing: [{ to_entity_id, relationship_type, ... }],
//   incoming: [{ from_entity_id, relationship_type, ... }]
// }
```

## Zustand Store Integration

```javascript
import useStore from '@/store/useStore';

// In a component
const entityPages = useStore((state) => state.entityPages);
const addEntityPage = useStore((state) => state.addEntityPage);

// Add to store after creating
const { data } = await createEntityPage(...);
addEntityPage(data);
```

## Cost Analysis

**Database Storage:**
- Metadata per page: ~1KB
- 1000 pages = ~1MB (negligible)

**Supabase Storage:**
- Content per page: ~5-50KB average
- 1000 pages = ~25MB
- Cost: $0.021/GB/month = ~$0.0005/month for 25MB

**Total for 1000 pages:** < $1/month

## Relationship Types

Common relationship types for `entity_links`:

**Person → Theory:**
- `authored` - Created the theory
- `supports` - Supports the theory
- `contradicts` - Disagrees with theory
- `mentions` - References the theory

**Person → Person:**
- `student_of` - Was a student of
- `influenced` - Influenced another person
- `collaborated_with` - Worked together

**Event → Place:**
- `occurred_at` - Event happened at place
- `discovered_at` - Discovery made at place

**Theory → Place:**
- `proposes_location` - Theory proposes this as the location

## Future Enhancements

- Full-text search across markdown content (using Supabase FTS)
- Version history for entity pages
- Collaborative editing (real-time)
- Export to PDF/DOCX
- AI-generated content suggestions

## Migration

Run the migration:

```bash
# Apply migration to Supabase
supabase db push

# Or via SQL editor:
psql -h db.{project-ref}.supabase.co -U postgres -f supabase/migrations/20260921_create_entity_pages.sql
```

Create storage bucket:

```sql
-- In Supabase SQL Editor or via dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('entity-pages', 'entity-pages', true);
```

## Testing

```bash
npm test src/lib/entityPages.test.js
```

Tests are skipped by default (`.skip`) to avoid hitting live database during CI. Remove `.skip` when testing locally with test database.
