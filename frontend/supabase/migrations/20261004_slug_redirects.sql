-- Migration: Slug Redirects for Public Collections & Site URLs (2026-10-04)
-- DO NOT RUN DIRECTLY. Review in Supabase SQL Editor.

-- ============================================================================
-- 1. CREATE SLUG_REDIRECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('portfolio_collection', 'gallery', 'page')),
  old_slug text NOT NULL UNIQUE CHECK (char_length(old_slug) <= 150),
  new_slug text NOT NULL CHECK (char_length(new_slug) <= 150),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_slug_redirects_lookup 
  ON slug_redirects(entity_type, old_slug);

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE slug_redirects ENABLE ROW LEVEL SECURITY;

-- Public can read redirects so router/backend can forward smoothly
DROP POLICY IF EXISTS "Public can read slug_redirects" ON slug_redirects;
CREATE POLICY "Public can read slug_redirects"
  ON slug_redirects FOR SELECT
  USING (true);

-- Only authenticated admins can insert/update/delete redirects
DROP POLICY IF EXISTS "Admins can manage slug_redirects" ON slug_redirects;
CREATE POLICY "Admins can manage slug_redirects"
  ON slug_redirects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 3. HELPER RPC TO RESOLVE SLUG REDIRECT
-- ============================================================================
CREATE OR REPLACE FUNCTION resolve_slug_redirect(
  p_entity_type text,
  p_old_slug text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_slug text;
BEGIN
  SELECT new_slug INTO v_new_slug
  FROM slug_redirects
  WHERE entity_type = p_entity_type AND old_slug = p_old_slug
  LIMIT 1;

  RETURN v_new_slug;
END;
$$;
