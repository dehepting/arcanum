-- Enhanced artifacts table schema for Phase 1
-- Run this in Supabase SQL Editor

-- Drop and recreate artifacts table with enhanced schema
DROP TABLE IF EXISTS artifacts CASCADE;

CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'pottery', 'coins', 'sculptures', 'paintings', 'manuscripts', etc.
  subcategory TEXT, -- e.g., 'Attic Red-Figure' for pottery
  period TEXT, -- e.g., 'Late Bronze Age', 'Ming Dynasty', 'Archaic'
  estimated_age TEXT, -- e.g., '550-540 BCE', 'c. 1400 CE'

  -- Discovery Info
  date_found DATE,
  findspot_place_id UUID REFERENCES places(id),
  findspot_description TEXT,
  excavation_notes TEXT,

  -- Current Status
  current_location TEXT, -- e.g., 'British Museum, London'
  current_owner TEXT, -- e.g., 'British Museum'
  owner_type TEXT, -- 'museum', 'private', 'government', 'unknown'
  accession_number TEXT, -- Museum catalog number

  -- Physical Properties
  material TEXT, -- e.g., 'terracotta', 'bronze', 'marble'
  dimensions TEXT, -- e.g., 'H: 45cm, W: 30cm, D: 15cm'
  weight TEXT,
  condition TEXT, -- 'excellent', 'good', 'fair', 'poor', 'fragmentary'

  -- Documentation
  image_urls TEXT[], -- Array of Supabase Storage URLs
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on findspot for faster queries
CREATE INDEX idx_artifacts_findspot ON artifacts(findspot_place_id);
CREATE INDEX idx_artifacts_category ON artifacts(category);
CREATE INDEX idx_artifacts_project ON artifacts(project_id);

-- Create storage bucket for artifact images
INSERT INTO storage.buckets (id, name, public)
VALUES ('artifacts', 'artifacts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy
CREATE POLICY "Allow all operations on artifacts" ON storage.objects
  FOR ALL
  USING (bucket_id = 'artifacts');
