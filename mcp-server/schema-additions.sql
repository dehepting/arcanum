-- Schema additions for MCP server migration to SQLite
-- These tables are missing from the Tauri database but needed by the MCP server

-- Artifact provenance tracking (ownership history)
CREATE TABLE IF NOT EXISTS artifact_provenance (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  date_from TEXT,
  date_to TEXT,
  is_current INTEGER DEFAULT 0,
  owner_name TEXT NOT NULL,
  owner_type TEXT,
  location TEXT,
  transfer_method TEXT,
  transfer_details TEXT,
  purchase_price TEXT,
  notes TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artifact_provenance_artifact ON artifact_provenance(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_provenance_current ON artifact_provenance(is_current);

-- Annotation to events links (missing junction table)
CREATE TABLE IF NOT EXISTS annotation_events_links (
  id TEXT PRIMARY KEY,
  annotation_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'mentions',
  quote TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_annotation_events_annotation ON annotation_events_links(annotation_id);
CREATE INDEX IF NOT EXISTS idx_annotation_events_event ON annotation_events_links(event_id);

-- Event to places links (geographic locations of events)
CREATE TABLE IF NOT EXISTS event_places_links (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'occurred_at',
  created_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_places_event ON event_places_links(event_id);
CREATE INDEX IF NOT EXISTS idx_event_places_place ON event_places_links(place_id);

-- People to places links (geographic associations of people)
CREATE TABLE IF NOT EXISTS people_places_links (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'associated_with',
  created_at TEXT NOT NULL,
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_people_places_person ON people_places_links(person_id);
CREATE INDEX IF NOT EXISTS idx_people_places_place ON people_places_links(place_id);
