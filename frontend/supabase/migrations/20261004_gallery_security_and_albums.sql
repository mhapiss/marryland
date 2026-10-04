-- Migration: Gallery Security, Family Albums, RPCs & Missing Photo Resilience (2026-10-04)
-- DO NOT RUN DIRECTLY. Review and execute in Supabase SQL Editor.

-- ============================================================================
-- 1. EXTEND GALLERIES TABLE FOR FAMILY ALBUM (SECOND LINK)
-- ============================================================================
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS album_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS album_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS album_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS album_pin_failed_attempts INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS album_pin_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS album_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS album_allow_download BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS album_cover_photo_id UUID,
ADD COLUMN IF NOT EXISTS album_scope TEXT NOT NULL DEFAULT 'all' CHECK (album_scope IN ('all', 'selected_only'));

-- Add is_missing flag to gallery_photos for drive resilience
ALTER TABLE gallery_photos
ADD COLUMN IF NOT EXISTS is_missing BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on client_slug for fast RPC lookups
CREATE INDEX IF NOT EXISTS idx_galleries_client_slug ON galleries(client_slug);
CREATE INDEX IF NOT EXISTS idx_galleries_album_token ON galleries(album_token);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery_id ON gallery_photos(gallery_id);

-- ============================================================================
-- 2. SECURE PUBLIC ACCESS & PREVENT ENUMERATION OF GALLERIES TABLE
-- ============================================================================
-- Revoke direct SELECT on galleries from anon to prevent enumeration attacks
DROP POLICY IF EXISTS "Public bisa melihat galeri" ON galleries;
DROP POLICY IF EXISTS "Public bisa melihat foto galeri" ON gallery_photos;

-- Photographers can still manage their own galleries
-- (Existing policies "Fotografer bisa melihat galerinya sendiri" etc. remain intact)

-- ============================================================================
-- 3. RPC: GET PUBLIC GALLERY (Single slug lookup, minimal safe columns)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_public_gallery(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  client_name TEXT,
  client_slug TEXT,
  max_photos_selectable INT,
  deadline_date DATE,
  highlight_description TEXT,
  allow_download BOOLEAN,
  status TEXT,
  selected_count INT,
  album_enabled BOOLEAN,
  studio_name TEXT,
  studio_logo TEXT,
  accent_color TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.client_name,
    g.client_slug,
    g.max_photos_selectable,
    g.deadline_date,
    g.highlight_description,
    g.allow_download,
    g.status,
    g.selected_count,
    g.album_enabled,
    COALESCE(u.raw_user_meta_data->>'studio_name', 'Studio') AS studio_name,
    COALESCE(u.raw_user_meta_data->>'studio_logo', '') AS studio_logo,
    COALESCE(u.raw_user_meta_data->>'accent_color', '#9B2C24') AS accent_color
  FROM galleries g
  LEFT JOIN auth.users u ON u.id = g.user_id
  WHERE g.client_slug = p_slug
  LIMIT 1;
END;
$$;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION get_public_gallery(TEXT) TO anon, authenticated;

-- ============================================================================
-- 4. RPC: GET PUBLIC GALLERY PHOTOS (Only for valid gallery)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_public_gallery_photos(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  gallery_id UUID,
  gdrive_file_id TEXT,
  filename TEXT,
  thumbnail_url TEXT,
  order_index INT,
  is_missing BOOLEAN
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
    gp.is_missing
  FROM gallery_photos gp
  WHERE gp.gallery_id = v_gallery_id
  ORDER BY gp.order_index ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_gallery_photos(TEXT) TO anon, authenticated;

-- ============================================================================
-- 5. RPC: GET FAMILY ALBUM (Second Link / Album Keluarga)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_family_album(
  p_slug TEXT,
  p_token TEXT,
  p_pin TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_gallery RECORD;
  v_cover_url TEXT := NULL;
  v_photos JSONB;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_studio_name TEXT := 'Studio';
  v_is_locked BOOLEAN := FALSE;
  v_lock_remaining_seconds INT := 0;
BEGIN
  -- 1. Find gallery by slug
  SELECT 
    g.*,
    u.raw_user_meta_data->>'studio_name' AS photographer_studio
  INTO v_gallery
  FROM galleries g
  LEFT JOIN auth.users u ON u.id = g.user_id
  WHERE g.client_slug = p_slug;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'GALLERY_NOT_FOUND', 'message', 'Galeri tidak ditemukan.');
  END IF;

  -- 2. Check if album feature is enabled
  IF NOT v_gallery.album_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALBUM_DISABLED', 'message', 'Album keluarga belum diaktifkan oleh fotografer.');
  END IF;

  -- 3. Check token match
  IF v_gallery.album_token IS NULL OR v_gallery.album_token != p_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Tautan album tidak valid atau telah diperbarui.');
  END IF;

  -- 4. Check expiration
  IF v_gallery.album_expires_at IS NOT NULL AND v_gallery.album_expires_at < v_now THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALBUM_EXPIRED', 'message', 'Tautan album ini telah kedaluwarsa.');
  END IF;

  -- 5. Check if temporarily locked due to failed PIN attempts
  IF v_gallery.album_pin_locked_until IS NOT NULL AND v_gallery.album_pin_locked_until > v_now THEN
    v_lock_remaining_seconds := EXTRACT(EPOCH FROM (v_gallery.album_pin_locked_until - v_now))::INT;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PIN_LOCKED',
      'message', 'Terlalu banyak percobaan PIN salah. Album terkunci sementara demi keamanan.',
      'lock_remaining_seconds', v_lock_remaining_seconds
    );
  END IF;

  -- 6. Check PIN protection if set
  IF v_gallery.album_pin_hash IS NOT NULL AND v_gallery.album_pin_hash != '' THEN
    -- If PIN not provided by client, return PIN_REQUIRED status
    IF p_pin IS NULL OR trim(p_pin) = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'PIN_REQUIRED',
        'message', 'Album ini dilindungi PIN oleh fotografer.',
        'album_title', v_gallery.client_name,
        'studio_name', COALESCE(v_gallery.photographer_studio, 'by.marryland')
      );
    END IF;

    -- Verify PIN with SHA-256 hash check (or pgcrypto crypt)
    -- In standard postgres: encode(digest(p_pin || 'marryland_salt', 'sha256'), 'hex')
    IF v_gallery.album_pin_hash != encode(digest(p_pin || 'marryland_pin_salt', 'sha256'), 'hex') THEN
      -- Increment failed attempts
      UPDATE galleries
      SET 
        album_pin_failed_attempts = album_pin_failed_attempts + 1,
        album_pin_locked_until = CASE 
          WHEN album_pin_failed_attempts + 1 >= 5 THEN v_now + INTERVAL '15 minutes'
          ELSE NULL
        END
      WHERE id = v_gallery.id;

      RETURN jsonb_build_object(
        'success', false,
        'error', 'PIN_INCORRECT',
        'message', 'PIN yang dimasukkan salah.',
        'remaining_attempts', GREATEST(0, 5 - (v_gallery.album_pin_failed_attempts + 1))
      );
    ELSE
      -- PIN correct! Reset failed attempts
      UPDATE galleries 
      SET album_pin_failed_attempts = 0, album_pin_locked_until = NULL 
      WHERE id = v_gallery.id;
    END IF;
  END IF;

  -- 7. Get cover photo url if specified
  IF v_gallery.album_cover_photo_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_cover_url 
    FROM gallery_photos 
    WHERE id = v_gallery.album_cover_photo_id;
  END IF;

  -- 8. Fetch photos based on album_scope ('all' or 'selected_only')
  IF v_gallery.album_scope = 'selected_only' THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', gp.id,
        'gdrive_file_id', gp.gdrive_file_id,
        'filename', gp.filename,
        'thumbnail_url', gp.thumbnail_url,
        'order_index', ps.selection_order,
        'is_missing', gp.is_missing
      ) ORDER BY ps.selection_order ASC
    ) INTO v_photos
    FROM photo_selections ps
    JOIN gallery_photos gp ON gp.id = ps.gallery_photo_id
    WHERE ps.gallery_id = v_gallery.id;
  ELSE
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', gp.id,
        'gdrive_file_id', gp.gdrive_file_id,
        'filename', gp.filename,
        'thumbnail_url', gp.thumbnail_url,
        'order_index', gp.order_index,
        'is_missing', gp.is_missing
      ) ORDER BY gp.order_index ASC
    ) INTO v_photos
    FROM gallery_photos gp
    WHERE gp.gallery_id = v_gallery.id;
  END IF;

  -- Fallback cover photo to first photo if cover is null
  IF v_cover_url IS NULL AND v_photos IS NOT NULL AND jsonb_array_length(v_photos) > 0 THEN
    v_cover_url := v_photos->0->>'thumbnail_url';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'album', jsonb_build_object(
      'id', v_gallery.id,
      'title', v_gallery.client_name,
      'slug', v_gallery.client_slug,
      'event_date', v_gallery.event_date,
      'highlight_description', v_gallery.highlight_description,
      'studio_name', COALESCE(v_gallery.photographer_studio, 'by.marryland'),
      'cover_url', v_cover_url,
      'allow_download', v_gallery.album_allow_download,
      'expires_at', v_gallery.album_expires_at,
      'scope', v_gallery.album_scope,
      'photo_count', COALESCE(jsonb_array_length(v_photos), 0)
    ),
    'photos', COALESCE(v_photos, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_family_album(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- 6. VERIFICATION QUERIES (Commented for review)
-- ============================================================================
-- SELECT get_public_gallery('sample-slug');
-- SELECT get_public_gallery_photos('sample-slug');
-- SELECT get_family_album('sample-slug', 'sample_token_xyz');
