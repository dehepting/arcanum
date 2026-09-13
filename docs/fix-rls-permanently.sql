-- Permanently disable RLS for all Arcanum tables
-- This is appropriate for a solo research tool
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS annotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS places DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS annotation_place_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS map_overlays DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS artifacts DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled (should all return false)
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'projects',
    'sources',
    'annotations',
    'places',
    'annotation_place_links',
    'map_overlays',
    'artifacts'
  )
ORDER BY tablename;
