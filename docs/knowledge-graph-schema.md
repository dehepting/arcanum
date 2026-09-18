# Knowledge Graph Schema Documentation

## Overview

The knowledge graph schema extends Arcanum with three new entity types (People, Events, Theories) and five junction tables to model relationships between entities. This enables users to build a connected knowledge graph of historical research, tracking people, events, theories, and how they relate to sources, places, and artifacts.

## Entity Tables

### People

Represents historical figures, authors, researchers, artifact owners, and collectors.

**Fields:**
- `id` - Unique identifier (UUID)
- `project_id` - Foreign key to projects table
- `name` - Person's name (required)
- `role` - Type of person: `author`, `historical_figure`, `researcher`, `owner`, `collector`
- `birth_year` - Birth year (negative for BC dates, e.g., -427 for 427 BC)
- `death_year` - Death year (negative for BC dates)
- `bio` - Biography text
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

**Example:**
```sql
INSERT INTO people (project_id, name, role, birth_year, death_year, bio)
VALUES (
  '...project-uuid...',
  'Plato',
  'historical_figure',
  -427,
  -347,
  'Ancient Greek philosopher who first mentioned Atlantis in Timaeus and Critias'
);
```

### Events

Represents historical events, discoveries, publications, battles, and expeditions.

**Fields:**
- `id` - Unique identifier (UUID)
- `project_id` - Foreign key to projects table
- `name` - Event name (required)
- `date_year` - Year of event (negative for BC dates)
- `date_precision` - Precision: `year`, `decade`, `century`, `circa`
- `event_type` - Type: `disaster`, `discovery`, `publication`, `battle`, `expedition`
- `description` - Event description
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

**Example:**
```sql
INSERT INTO events (project_id, name, date_year, date_precision, event_type, description)
VALUES (
  '...project-uuid...',
  'Plato writes Timaeus',
  -360,
  'circa',
  'publication',
  'Plato writes the dialogue Timaeus, which contains the first known mention of Atlantis'
);
```

### Theories

Represents research theories about locations, civilizations, or artifacts.

**Fields:**
- `id` - Unique identifier (UUID)
- `project_id` - Foreign key to projects table
- `name` - Theory name (required)
- `description` - Theory description
- `proposed_location_id` - Optional foreign key to places table
- `status` - Status: `active`, `debunked`, `proven`, `historical`
- `confidence_level` - Confidence (1-5 stars)
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

**Example:**
```sql
INSERT INTO theories (project_id, name, description, status, confidence_level)
VALUES (
  '...project-uuid...',
  'Atlantis in the Mediterranean',
  'Theory that Atlantis was located in the Mediterranean, possibly Santorini/Thera',
  'active',
  3
);
```

## Junction Tables (Relationships)

### annotation_people_links

Links source annotations to people mentioned in the text.

**Relationship Types:**
- `mentions` - Annotation mentions this person
- `authored_by` - Source was written by this person
- `about` - Annotation is primarily about this person

**Example Use Case:**
User highlights text in PDF: "Plato describes a great civilization..." → Creates annotation → Links to Person "Plato" with relationship_type `mentions`.

### annotation_events_links

Links source annotations to events mentioned in the text.

**Relationship Types:**
- `mentions` - Annotation mentions this event
- `describes` - Annotation provides detailed description of event
- `occurred_during` - Content describes something that happened during this event

**Example Use Case:**
User highlights text about an excavation → Creates annotation → Links to Event "1922 Excavation of Site B" with relationship_type `describes`.

### annotation_theories_links

Links source annotations to theories.

**Relationship Types:**
- `supports` - Annotation provides evidence supporting theory
- `contradicts` - Annotation contradicts theory
- `mentions` - Annotation mentions theory

**Example Use Case:**
User finds text supporting Atlantis theory → Creates annotation → Links to Theory "Atlantis in Mediterranean" with relationship_type `supports`.

### event_places_links

Links events to geographic locations.

**Relationship Types:**
- `occurred_at` - Event occurred at this place
- `discovered_at` - Discovery/excavation at this place
- `affected` - Event affected this place

**Example Use Case:**
Event "Battle of Marathon" → Linked to Place "Marathon, Greece" with relationship_type `occurred_at`.

### people_places_links

Links people to geographic locations.

**Relationship Types:**
- `born_at` - Person born at this place
- `died_at` - Person died at this place
- `lived_at` - Person lived at this place
- `discovered` - Person discovered this place
- `visited` - Person visited this place

**Example Use Case:**
Person "Plato" → Linked to Place "Athens" with relationship_type `lived_at`.

## Entity Relationship Diagram

```
┌─────────────┐
│  Projects   │
└──────┬──────┘
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌──────────┐       ┌──────────┐      ┌──────────┐      ┌──────────┐
│  People  │       │  Events  │      │ Theories │      │  Places  │
└────┬─────┘       └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                  │                  │                  │
     │                  │                  │                  │
     └────┬─────────────┼──────────────────┤                  │
          │             │                  │                  │
          ▼             ▼                  ▼                  ▼
    ┌──────────────────────────────────────────────────┐
    │              Annotations                         │
    │  (from Sources - PDFs, images, etc.)             │
    └──────────────────────────────────────────────────┘
          │             │                  │
          │             │                  │
          ▼             ▼                  ▼
    annotation_    annotation_      annotation_
    people_links   events_links     theories_links

          │             │
          │             │
    ┌─────┴─────────────┴─────┐
    │                          │
    ▼                          ▼
event_places_links      people_places_links
```

## Query Examples

### Find all people mentioned in a source
```sql
SELECT p.*, apl.relationship_type, a.text as annotation_text
FROM people p
JOIN annotation_people_links apl ON p.id = apl.person_id
JOIN annotations a ON a.id = apl.annotation_id
WHERE a.source_id = '...source-uuid...';
```

### Find all events at a location
```sql
SELECT e.*, epl.relationship_type
FROM events e
JOIN event_places_links epl ON e.id = epl.event_id
WHERE epl.place_id = '...place-uuid...';
```

### Find all annotations supporting a theory
```sql
SELECT a.*, atl.relationship_type, s.title as source_title
FROM annotations a
JOIN annotation_theories_links atl ON a.id = atl.annotation_id
JOIN sources s ON a.source_id = s.id
WHERE atl.theory_id = '...theory-uuid...'
  AND atl.relationship_type = 'supports';
```

### Build evidence chain: Theory → Annotations → People
```sql
SELECT
  t.name as theory_name,
  a.text as evidence,
  p.name as mentioned_person,
  s.title as source_title,
  a.page_number
FROM theories t
JOIN annotation_theories_links atl ON t.id = atl.theory_id
JOIN annotations a ON a.id = atl.annotation_id
JOIN sources s ON a.source_id = s.id
LEFT JOIN annotation_people_links apl ON a.id = apl.annotation_id
LEFT JOIN people p ON p.id = apl.person_id
WHERE t.id = '...theory-uuid...'
ORDER BY s.title, a.page_number;
```

## Migration Instructions

### Apply Migration to Supabase

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `docs/knowledge-graph-schema.sql`
3. Run the migration
4. Verify tables created:
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
     AND (tablename LIKE '%people%'
       OR tablename LIKE '%event%'
       OR tablename LIKE '%theor%');
   ```

### Rollback (if needed)

```sql
DROP TABLE IF EXISTS people_places_links;
DROP TABLE IF EXISTS event_places_links;
DROP TABLE IF EXISTS annotation_theories_links;
DROP TABLE IF EXISTS annotation_events_links;
DROP TABLE IF EXISTS annotation_people_links;
DROP TABLE IF EXISTS theories;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS people;
```

## Future Extensions

**Potential additional junction tables:**
- `people_events_links` - Link people to events they participated in
- `people_theories_links` - Link people who proposed theories
- `artifact_events_links` - Link artifacts to discovery/creation events
- `artifact_theories_links` - Link artifacts that support/contradict theories

**Potential entity enhancements:**
- Add `tags` JSONB field for flexible categorization
- Add `external_links` JSONB for URLs to external databases
- Add `confidence_notes` to document why confidence level was assigned
- Add full-text search indices for better search performance
