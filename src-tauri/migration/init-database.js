#!/usr/bin/env node

/**
 * Initialize SQLite database with schema
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'arcanum.db');

console.log('Initializing SQLite database...\n');

// Remove existing database if it exists
if (fs.existsSync(DB_PATH)) {
  console.log('✓ Removing existing database');
  fs.unlinkSync(DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

console.log('✓ Creating tables...\n');

// Run all CREATE TABLE statements
const schema = `
-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Places
CREATE TABLE places (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  description TEXT,
  place_type TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_places_project ON places(project_id);

-- Artifacts
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  date_range TEXT,
  owner_type TEXT,
  owner_name TEXT,
  findspot_place_id TEXT,
  images TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (findspot_place_id) REFERENCES places(id) ON DELETE SET NULL
);

CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_artifacts_findspot ON artifacts(findspot_place_id);

-- People
CREATE TABLE people (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  birth_date TEXT,
  death_date TEXT,
  occupation TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_people_project ON people(project_id);

-- Events
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_date TEXT,
  location TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_project ON events(project_id);

-- Theories
CREATE TABLE theories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_theories_project ON theories(project_id);

-- Entity pages
CREATE TABLE entity_pages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_entity_pages_entity ON entity_pages(entity_id);
CREATE INDEX idx_entity_pages_project ON entity_pages(project_id);
CREATE UNIQUE INDEX idx_entity_pages_unique_entity ON entity_pages(entity_id);

-- Entity links
CREATE TABLE entity_links (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  from_entity_id TEXT NOT NULL,
  from_entity_type TEXT NOT NULL,
  to_entity_id TEXT NOT NULL,
  to_entity_type TEXT NOT NULL,
  relationship_type TEXT,
  verified INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_entity_links_from ON entity_links(from_entity_id);
CREATE INDEX idx_entity_links_to ON entity_links(to_entity_id);
CREATE INDEX idx_entity_links_project ON entity_links(project_id);

-- Sources
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_sources_project ON sources(project_id);

-- Annotations
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  page_number INTEGER,
  annotation_type TEXT NOT NULL,
  content TEXT,
  geometry TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_annotations_source ON annotations(source_id);
CREATE INDEX idx_annotations_project ON annotations(project_id);

-- Annotation links
CREATE TABLE annotation_people_links (
  id TEXT PRIMARY KEY,
  annotation_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'mentions',
  created_at TEXT NOT NULL,
  FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE INDEX idx_annotation_people_annotation ON annotation_people_links(annotation_id);
CREATE INDEX idx_annotation_people_person ON annotation_people_links(person_id);

CREATE TABLE annotation_theories_links (
  id TEXT PRIMARY KEY,
  annotation_id TEXT NOT NULL,
  theory_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
  FOREIGN KEY (theory_id) REFERENCES theories(id) ON DELETE CASCADE
);

CREATE INDEX idx_annotation_theories_annotation ON annotation_theories_links(annotation_id);
CREATE INDEX idx_annotation_theories_theory ON annotation_theories_links(theory_id);

CREATE TABLE annotation_place_links (
  id TEXT PRIMARY KEY,
  annotation_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX idx_annotation_place_annotation ON annotation_place_links(annotation_id);
CREATE INDEX idx_annotation_place_place ON annotation_place_links(place_id);

-- Map overlays
CREATE TABLE map_overlays (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  bounds TEXT NOT NULL,
  opacity REAL DEFAULT 0.7,
  visible INTEGER DEFAULT 1,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_map_overlays_project ON map_overlays(project_id);
`;

db.exec(schema, (err) => {
  if (err) {
    console.error('✗ Error creating schema:', err);
    process.exit(1);
  }

  console.log('✓ Schema created successfully!');
  console.log(`✓ Database location: ${DB_PATH}\n`);

  db.close();

  console.log('Ready to import data. Run: node import-to-sqlite.js');
});
