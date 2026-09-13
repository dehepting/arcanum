-- Create storage bucket for map overlays
-- Run this in Supabase SQL Editor

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('overlays', 'overlays', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow all operations (since RLS is disabled for solo use)
CREATE POLICY "Allow all operations on overlays" ON storage.objects
  FOR ALL
  USING (bucket_id = 'overlays');
