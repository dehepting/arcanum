-- Disable Row Level Security for Arcanum (solo research tool)
-- Run this in Supabase SQL Editor

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE annotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE places DISABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_place_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE map_overlays DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_provenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_source_links DISABLE ROW LEVEL SECURITY;

-- Verify all tables have RLS disabled:
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN (
  'projects', 'sources', 'annotations', 'places',
  'annotation_place_links', 'map_overlays', 'artifacts',
  'artifact_provenance', 'artifact_claims', 'artifact_source_links'
)
ORDER BY relname;
-- All should show: relrowsecurity = f (false)
