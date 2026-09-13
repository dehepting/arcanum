-- Phase 3: Source-Artifact Linking Schema
-- Migration to create bidirectional linking between artifacts and PDF annotations
-- Run this in Supabase SQL Editor

-- Create junction table for linking artifacts to annotations
CREATE TABLE IF NOT EXISTS artifact_source_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  quote TEXT,                    -- Relevant excerpt from PDF
  context TEXT,                  -- Additional context about the mention
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artifact_id, annotation_id)  -- Prevent duplicate links
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_artifact_source_links_artifact
  ON artifact_source_links(artifact_id);

CREATE INDEX IF NOT EXISTS idx_artifact_source_links_annotation
  ON artifact_source_links(annotation_id);

-- Disable RLS to match other tables in this project
ALTER TABLE artifact_source_links DISABLE ROW LEVEL SECURITY;

-- Verify table was created
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'artifact_source_links'
ORDER BY ordinal_position;
