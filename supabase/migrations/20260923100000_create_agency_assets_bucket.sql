-- ============================================================================
-- REPORTLY — PHASE 7 AGENCY ASSETS STORAGE BUCKET & RLS POLICIES
-- ============================================================================

-- 1. Create agency_assets public storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency_assets',
  'agency_assets',
  true,
  2097152, -- 2MB max limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

-- 2. Storage RLS Policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Read Access for Agency Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload agency assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update agency assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete agency assets" ON storage.objects;

-- SELECT: Public read access for logos and brand assets
CREATE POLICY "Public Read Access for Agency Assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agency_assets');

-- INSERT: Authenticated users can upload assets
CREATE POLICY "Authenticated users can upload agency assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agency_assets'
    AND auth.role() = 'authenticated'
  );

-- UPDATE: Authenticated users can modify assets
CREATE POLICY "Authenticated users can update agency assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agency_assets'
    AND auth.role() = 'authenticated'
  );

-- DELETE: Authenticated users can delete assets
CREATE POLICY "Authenticated users can delete agency assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agency_assets'
    AND auth.role() = 'authenticated'
  );
