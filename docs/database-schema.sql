-- Arcanum Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Map settings
  map_center_lng FLOAT DEFAULT -20.0,
  map_center_lat FLOAT DEFAULT 36.0,
  map_zoom FLOAT DEFAULT 3.4
);

-- Sources (PDFs, images)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_type TEXT NOT NULL, -- 'pdf', 'image'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations (highlights, ink, text on PDF pages)
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  type TEXT NOT NULL, -- 'highlight', 'ink', 'text'
  -- Geometry (normalized 0-1 coordinates relative to page)
  rect_x FLOAT,
  rect_y FLOAT,
  rect_w FLOAT,
  rect_h FLOAT,
  -- Ink data (SVG path or Fabric.js JSON)
  ink_data JSONB,
  -- Text content
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Places (map pins)
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lng FLOAT NOT NULL,
  lat FLOAT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Links between annotations and places
CREATE TABLE annotation_place_links (
  annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  PRIMARY KEY (annotation_id, place_id)
);

-- Historic map overlays
CREATE TABLE map_overlays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL, -- Supabase Storage URL
  -- Georeferencing (corner coordinates)
  corners JSONB, -- [{img: [x,y], geo: [lng,lat]}, ...]
  opacity FLOAT DEFAULT 0.7,
  rotation FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifacts catalog
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  -- Findspot or collection location
  location_name TEXT,
  lng FLOAT,
  lat FLOAT,
  -- Metadata
  period TEXT,
  material TEXT,
  museum TEXT,
  image_url TEXT, -- Thumbnail
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sources_project ON sources(project_id);
CREATE INDEX idx_annotations_source ON annotations(source_id);
CREATE INDEX idx_places_project ON places(project_id);
CREATE INDEX idx_map_overlays_project ON map_overlays(project_id);
CREATE INDEX idx_artifacts_project ON artifacts(project_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
