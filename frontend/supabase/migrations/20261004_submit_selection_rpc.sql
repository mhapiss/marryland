-- Migration: Atomic & Idempotent Selection Submission RPC with RLS Safeguards (2026-10-04)
-- DO NOT RUN DIRECTLY. Review in Supabase SQL Editor.

-- ============================================================================
-- 1. ADD SUBMITTED_AT COLUMN TO GALLERIES (IF NOT EXISTS)
-- ============================================================================
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_galleries_status_submitted 
  ON galleries(status, submitted_at);

-- ============================================================================
-- 2. UPDATE RPC: get_public_gallery WITH SUBMITTED_AT & PHOTOGRAPHER CONTACT
-- ============================================================================
DROP FUNCTION IF EXISTS get_public_gallery(TEXT);

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
  accent_color TEXT,
  submitted_at TIMESTAMPTZ,
  photographer_phone TEXT
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
    COALESCE(u.raw_user_meta_data->>'accent_color', '#9B2C24') AS accent_color,
    g.submitted_at,
    COALESCE(u.raw_user_meta_data->>'whatsapp_number', '') AS photographer_phone
  FROM galleries g
  LEFT JOIN auth.users u ON u.id = g.user_id
  WHERE g.client_slug = p_slug
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_gallery(TEXT) TO anon, authenticated;

-- ============================================================================
-- 3. ATOMIC & IDEMPOTENT RPC: submit_gallery_selection
-- ============================================================================
DROP FUNCTION IF EXISTS submit_gallery_selection(TEXT, UUID[]);

CREATE OR REPLACE FUNCTION submit_gallery_selection(
  p_slug TEXT,
  p_selected_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gallery RECORD;
  v_phone TEXT;
  v_studio_name TEXT;
  v_photo_id UUID;
  v_order INT := 1;
  v_actual_count INT;
BEGIN
  -- 1. Validate gallery existence by client_slug
  SELECT 
    g.id,
    g.status,
    g.max_photos_selectable,
    g.deadline_date,
    g.submitted_at,
    g.selected_count,
    g.user_id
  INTO v_gallery
  FROM galleries g
  WHERE g.client_slug = p_slug
  FOR UPDATE; -- Row lock to prevent race conditions / double submission

  IF v_gallery.id IS NULL THEN
    RAISE EXCEPTION 'Galeri tidak ditemukan atau tautan tidak valid.';
  END IF;

  -- 2. Fetch photographer metadata for WhatsApp direct submission
  SELECT 
    COALESCE(u.raw_user_meta_data->>'whatsapp_number', ''),
    COALESCE(u.raw_user_meta_data->>'studio_name', 'Studio')
  INTO v_phone, v_studio_name
  FROM auth.users u
  WHERE u.id = v_gallery.user_id;

  -- 3. Idempotent check: if gallery already completed, return success gracefully without throwing
  IF v_gallery.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_completed', true,
      'submitted_at', v_gallery.submitted_at,
      'selected_count', v_gallery.selected_count,
      'photographer_phone', v_phone,
      'studio_name', v_studio_name
    );
  END IF;

  -- 4. Validate deadline
  IF v_gallery.deadline_date IS NOT NULL AND v_gallery.deadline_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Batas waktu pemilihan foto untuk galeri ini telah berakhir.';
  END IF;

  -- 5. Validate selections count
  v_actual_count := COALESCE(array_length(p_selected_ids, 1), 0);
  IF v_actual_count = 0 THEN
    RAISE EXCEPTION 'Belum ada foto yang dipilih. Silakan pilih minimal satu foto sebelum mengirim.';
  END IF;

  IF v_gallery.max_photos_selectable > 0 AND v_actual_count > v_gallery.max_photos_selectable THEN
    RAISE EXCEPTION 'Jumlah foto yang dipilih (%) melebihi kuota maksimal (%).', 
      v_actual_count, v_gallery.max_photos_selectable;
  END IF;

  -- 6. Atomically synchronize photo_selections
  -- Remove any previous selections not in current submission
  DELETE FROM photo_selections
  WHERE gallery_id = v_gallery.id
  AND gallery_photo_id != ALL(p_selected_ids);

  -- Upsert all selected photo ids with their sequence order
  FOREACH v_photo_id IN ARRAY p_selected_ids
  LOOP
    INSERT INTO photo_selections (gallery_id, gallery_photo_id, selection_order)
    VALUES (v_gallery.id, v_photo_id, v_order)
    ON CONFLICT (gallery_id, gallery_photo_id) 
    DO UPDATE SET selection_order = v_order;

    v_order := v_order + 1;
  END LOOP;

  -- 7. Atomically lock gallery and record submission timestamp
  UPDATE galleries
  SET 
    status = 'completed',
    submitted_at = now(),
    selected_count = v_actual_count,
    updated_at = now()
  WHERE id = v_gallery.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'submitted_at', now(),
    'selected_count', v_actual_count,
    'photographer_phone', v_phone,
    'studio_name', v_studio_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_gallery_selection(TEXT, UUID[]) TO anon, authenticated;

-- ============================================================================
-- 4. RLS AUDIT & VERIFICATION QUERIES (RUN IN SUPABASE SQL EDITOR TO TEST)
-- ============================================================================
/*
-- TEST A: Verify anonymous user cannot directly update galleries table:
-- SET ROLE anon;
-- UPDATE galleries SET status = 'completed' WHERE client_slug = 'sample-client';
-- Expected: Error or 0 rows affected due to RLS.

-- TEST B: Verify anonymous user CAN submit selection atomically via RPC:
-- SELECT submit_gallery_selection(
--   'sample-client',
--   ARRAY['00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid]
-- );
-- Expected: JSON result with success=true and submitted_at timestamp.

-- TEST C: Verify idempotency on second call:
-- SELECT submit_gallery_selection(
--   'sample-client',
--   ARRAY['00000000-0000-0000-0000-000000000001'::uuid]
-- );
-- Expected: JSON result with success=true, already_completed=true.
*/
