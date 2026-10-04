-- Migration: Client Gallery Selection Features & Metadata (2026-10-04)
-- DO NOT RUN DIRECTLY. Review and execute in Supabase SQL Editor.

-- ============================================================================
-- 1. ADD PHOTO DIMENSIONS, ROTATION & METADATA TO GALLERY_PHOTOS
-- ============================================================================
ALTER TABLE gallery_photos
ADD COLUMN IF NOT EXISTS width INT,
ADD COLUMN IF NOT EXISTS height INT,
ADD COLUMN IF NOT EXISTS rotation INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS folder_path TEXT DEFAULT '';

-- Add index on gallery_photos for fast sorting and filtering
CREATE INDEX IF NOT EXISTS idx_gallery_photos_highlight ON gallery_photos(gallery_id, is_highlight);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_order ON gallery_photos(gallery_id, order_index);

-- ============================================================================
-- 2. UPDATE RPC: get_public_gallery_photos WITH DIMENSIONS & METADATA
-- ============================================================================
DROP FUNCTION IF EXISTS get_public_gallery_photos(TEXT);

CREATE OR REPLACE FUNCTION get_public_gallery_photos(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  gallery_id UUID,
  gdrive_file_id TEXT,
  filename TEXT,
  thumbnail_url TEXT,
  order_index INT,
  is_missing BOOLEAN,
  width INT,
  height INT,
  rotation INT,
  is_highlight BOOLEAN,
  folder_path TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_gallery_id UUID;
BEGIN
  SELECT g.id INTO v_gallery_id FROM galleries g WHERE g.client_slug = p_slug;
  IF v_gallery_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    gp.id,
    gp.gallery_id,
    gp.gdrive_file_id,
    gp.filename,
    gp.thumbnail_url,
    gp.order_index,
    COALESCE(gp.is_missing, false) AS is_missing,
    gp.width,
    gp.height,
    COALESCE(gp.rotation, 0) AS rotation,
    COALESCE(gp.is_highlight, false) AS is_highlight,
    COALESCE(gp.folder_path, '') AS folder_path
  FROM gallery_photos gp
  WHERE gp.gallery_id = v_gallery_id
  ORDER BY gp.order_index ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_gallery_photos(TEXT) TO anon, authenticated;

-- ============================================================================
-- 3. ENSURE SELECTION LIMIT TRIGGER PREVENTS RACE CONDITIONS
-- ============================================================================
-- Mencegah kondisi balapan (race condition) ketika klien memilih foto serentak dari multiple tab/perangkat
CREATE OR REPLACE FUNCTION check_selection_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_limit INT;
  current_count INT;
BEGIN
  -- Kunci baris galeri untuk mencegah race condition (SELECT FOR UPDATE)
  SELECT max_photos_selectable INTO max_limit
  FROM galleries
  WHERE id = NEW.gallery_id
  FOR UPDATE;

  -- Hitung jumlah foto yang telah dipilih
  SELECT COUNT(*) INTO current_count
  FROM photo_selections
  WHERE gallery_id = NEW.gallery_id;

  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Batas maksimal pilihan foto telah tercapai (maksimal % foto)', max_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_selection_limit ON photo_selections;
CREATE TRIGGER enforce_selection_limit
BEFORE INSERT ON photo_selections
FOR EACH ROW
EXECUTE FUNCTION check_selection_limit();

-- ============================================================================
-- 4. VERIFICATION QUERY (FOR ADMIN TESTING IN SUPABASE)
-- ============================================================================
-- SELECT * FROM get_public_gallery_photos('contoh-slug-galeri');
