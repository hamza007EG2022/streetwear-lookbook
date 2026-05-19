-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/your-project/sql/new)

-- Create the main data table
CREATE TABLE IF NOT EXISTS site_data (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Allow public access (the anon key is scoped to this)
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all" ON site_data;
CREATE POLICY "anon_all" ON site_data FOR ALL USING (true) WITH CHECK (true);

-- Insert the initial default row
INSERT INTO site_data (id, data, updated_at)
VALUES ('default', '{}'::jsonb, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to images bucket
DROP POLICY IF EXISTS "anon_images" ON storage.objects;
CREATE POLICY "anon_images" ON storage.objects FOR ALL USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
