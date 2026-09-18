-- Knowledge Graph Database Schema Migration
-- Phase 1A: Add People, Events, Theories and their relationships
--
-- This migration adds 3 new entity tables and 5 junction tables to support
-- knowledge graph functionality for tracking people, events, and theories
-- related to archaeological/historical research projects.

-- =============================================================================
-- ENTITY TABLES
-- =============================================================================

-- People: Historical figures, authors, researchers, artifact owners
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT, -- 'author', 'historical_figure', 'researcher', 'owner', 'collector'
  birth_year INTEGER,
  death_year INTEGER,
  bio TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_people_project ON people(project_id);
CREATE INDEX idx_people_name ON people(name);
CREATE INDEX idx_people_role ON people(role);

-- Disable RLS to match existing schema pattern
ALTER TABLE people DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE people IS 'People involved in research: historical figures, authors, researchers, collectors';
COMMENT ON COLUMN people.role IS 'Role type: author, historical_figure, researcher, owner, collector';
COMMENT ON COLUMN people.birth_year IS 'Birth year (negative for BC dates)';
COMMENT ON COLUMN people.death_year IS 'Death year (negative for BC dates)';


-- Events: Historical events, discoveries, publications, battles
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_year INTEGER, -- Negative for BC dates
  date_precision TEXT DEFAULT 'year', -- 'year', 'decade', 'century', 'circa'
  event_type TEXT, -- 'disaster', 'discovery', 'publication', 'battle', 'expedition'
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_project ON events(project_id);
CREATE INDEX idx_events_date ON events(date_year);
CREATE INDEX idx_events_type ON events(event_type);

-- Disable RLS to match existing schema pattern
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE events IS 'Historical events, discoveries, publications, expeditions';
COMMENT ON COLUMN events.date_year IS 'Year of event (negative for BC dates)';
COMMENT ON COLUMN events.date_precision IS 'Date precision: year, decade, century, circa';
COMMENT ON COLUMN events.event_type IS 'Event type: disaster, discovery, publication, battle, expedition';


-- Theories: Research theories about locations, civilizations, artifacts
CREATE TABLE theories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  proposed_location_id UUID REFERENCES places(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active', -- 'active', 'debunked', 'proven', 'historical'
  confidence_level INTEGER DEFAULT 3, -- 1-5 (1=very low, 5=very high)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_theories_project ON theories(project_id);
CREATE INDEX idx_theories_location ON theories(proposed_location_id);
CREATE INDEX idx_theories_status ON theories(status);

-- Disable RLS to match existing schema pattern
ALTER TABLE theories DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE theories IS 'Research theories about locations, civilizations, artifacts';
COMMENT ON COLUMN theories.proposed_location_id IS 'Geographic location associated with theory (optional)';
COMMENT ON COLUMN theories.status IS 'Theory status: active, debunked, proven, historical';
COMMENT ON COLUMN theories.confidence_level IS 'Confidence level 1-5 (1=very low, 5=very high)';


-- =============================================================================
-- JUNCTION TABLES (Entity Relationships)
-- =============================================================================

-- Annotation-People Links: Connect source annotations to people mentioned
CREATE TABLE annotation_people_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'mentions', -- 'mentions', 'authored_by', 'about'
  quote TEXT, -- Relevant excerpt from annotation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(annotation_id, person_id)
);

CREATE INDEX idx_annotation_people_annotation ON annotation_people_links(annotation_id);
CREATE INDEX idx_annotation_people_person ON annotation_people_links(person_id);
CREATE INDEX idx_annotation_people_relationship ON annotation_people_links(relationship_type);

-- Disable RLS to match existing schema pattern
ALTER TABLE annotation_people_links DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE annotation_people_links IS 'Links between source annotations and people';
COMMENT ON COLUMN annotation_people_links.relationship_type IS 'Relationship type: mentions, authored_by, about';


-- Annotation-Events Links: Connect source annotations to events mentioned
CREATE TABLE annotation_events_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'mentions', -- 'mentions', 'describes', 'occurred_during'
  quote TEXT, -- Relevant excerpt from annotation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(annotation_id, event_id)
);

CREATE INDEX idx_annotation_events_annotation ON annotation_events_links(annotation_id);
CREATE INDEX idx_annotation_events_event ON annotation_events_links(event_id);
CREATE INDEX idx_annotation_events_relationship ON annotation_events_links(relationship_type);

-- Disable RLS to match existing schema pattern
ALTER TABLE annotation_events_links DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE annotation_events_links IS 'Links between source annotations and events';
COMMENT ON COLUMN annotation_events_links.relationship_type IS 'Relationship type: mentions, describes, occurred_during';


-- Annotation-Theories Links: Connect source annotations to theories
CREATE TABLE annotation_theories_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  theory_id UUID NOT NULL REFERENCES theories(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'supports', -- 'supports', 'contradicts', 'mentions'
  quote TEXT, -- Relevant excerpt from annotation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(annotation_id, theory_id)
);

CREATE INDEX idx_annotation_theories_annotation ON annotation_theories_links(annotation_id);
CREATE INDEX idx_annotation_theories_theory ON annotation_theories_links(theory_id);
CREATE INDEX idx_annotation_theories_relationship ON annotation_theories_links(relationship_type);

-- Disable RLS to match existing schema pattern
ALTER TABLE annotation_theories_links DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE annotation_theories_links IS 'Links between source annotations and theories';
COMMENT ON COLUMN annotation_theories_links.relationship_type IS 'Relationship type: supports, contradicts, mentions';


-- Event-Places Links: Connect events to geographic locations
CREATE TABLE event_places_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'occurred_at', -- 'occurred_at', 'discovered_at', 'affected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, place_id)
);

CREATE INDEX idx_event_places_event ON event_places_links(event_id);
CREATE INDEX idx_event_places_place ON event_places_links(place_id);
CREATE INDEX idx_event_places_relationship ON event_places_links(relationship_type);

-- Disable RLS to match existing schema pattern
ALTER TABLE event_places_links DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE event_places_links IS 'Links between events and geographic locations';
COMMENT ON COLUMN event_places_links.relationship_type IS 'Relationship type: occurred_at, discovered_at, affected';


-- People-Places Links: Connect people to geographic locations
CREATE TABLE people_places_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'associated_with', -- 'born_at', 'died_at', 'lived_at', 'discovered', 'visited'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, place_id)
);

CREATE INDEX idx_people_places_person ON people_places_links(person_id);
CREATE INDEX idx_people_places_place ON people_places_links(place_id);
CREATE INDEX idx_people_places_relationship ON people_places_links(relationship_type);

-- Disable RLS to match existing schema pattern
ALTER TABLE people_places_links DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE people_places_links IS 'Links between people and geographic locations';
COMMENT ON COLUMN people_places_links.relationship_type IS 'Relationship type: born_at, died_at, lived_at, discovered, visited';


-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Uncomment to verify tables were created:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%people%' OR tablename LIKE '%event%' OR tablename LIKE '%theor%';

-- Uncomment to verify indexes:
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND (indexname LIKE '%people%' OR indexname LIKE '%event%' OR indexname LIKE '%theor%');
