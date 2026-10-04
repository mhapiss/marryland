-- Migration: Pre-release hardening (2026-10-05)
-- DO NOT RUN DIRECTLY. Review and execute in Supabase SQL Editor.
--
-- Isi:
--  1. Kolom galleries.updated_at (dipakai RPC kirim pilihan, tidak pernah dibuat di migrasi lain).
--  2. Menutup SELECT langsung anon pada galleries dan gallery_photos
--     (membocorkan album_token, album_pin_hash, client_whatsapp, dan daftar semua foto klien).
--  3. Kebijakan photo_selections lewat fungsi pembantu SECURITY DEFINER, sehingga tetap jalan
--     setelah poin 2, juga untuk fotografer yang sedang login saat menguji tautan klien.
--  4. Perbaikan trigger batas pilihan: tidak menolak baris yang sudah ada (sebelumnya klien yang
--     mengisi kuota tepat penuh gagal kirim), dan berjalan sebagai SECURITY DEFINER.
--  5. RPC submit_gallery_selection: boleh memperbarui pilihan setelah terkirim (fitur kunci
--     dihapus), memvalidasi foto milik galeri, tenggat memakai tanggal WIB.
--  6. Trigger yang menjaga galleries.selected_count tetap akurat (anon tidak bisa UPDATE galleries).

-- ============================================================================
-- 1. KOLOM updated_at
-- ============================================================================
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 2. FUNGSI PEMBANTU UNTUK RLS (SECURITY DEFINER, tidak bergantung pada SELECT anon)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.gallery_is_public(p_gallery_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = p_gallery_id
      AND g.status IN ('active', 'completed')
  );
$$;

CREATE OR REPLACE FUNCTION public.gallery_accepts_selection(p_gallery_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = p_gallery_id
      AND g.status IN ('active', 'completed')
      AND (g.deadline_date IS NULL OR g.deadline_date >= (now() AT TIME ZONE 'Asia/Jakarta')::date)
  );
$$;

CREATE OR REPLACE FUNCTION public.photo_belongs_to_gallery(p_photo_id UUID, p_gallery_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gallery_photos gp
    WHERE gp.id = p_photo_id
      AND gp.gallery_id = p_gallery_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.gallery_is_public(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gallery_accepts_selection(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.photo_belongs_to_gallery(UUID, UUID) TO anon, authenticated;

-- ============================================================================
-- 3. TUTUP SELECT LANGSUNG ANON PADA galleries DAN gallery_photos
--    Klien membaca data hanya lewat RPC get_public_gallery, get_public_gallery_photos,
--    dan get_family_album. Fotografer tetap lewat kebijakan pemilik.
-- ============================================================================
DROP POLICY IF EXISTS "Anon can view active and completed galleries" ON galleries;
DROP POLICY IF EXISTS "Public bisa melihat galeri" ON galleries;
DROP POLICY IF EXISTS "Anon can view photos of active and completed galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Public bisa melihat foto galeri" ON gallery_photos;

-- ============================================================================
-- 4. KEBIJAKAN photo_selections
-- ============================================================================
DROP POLICY IF EXISTS "Anon can view selections of active and completed galleries" ON photo_selections;
DROP POLICY IF EXISTS "Anon can insert selections if gallery is active" ON photo_selections;
DROP POLICY IF EXISTS "Anon can delete selections if gallery is active" ON photo_selections;
DROP POLICY IF EXISTS "Klien dapat melihat pilihan galeri publik" ON photo_selections;
DROP POLICY IF EXISTS "Klien dapat menambah pilihan galeri terbuka" ON photo_selections;
DROP POLICY IF EXISTS "Klien dapat menghapus pilihan galeri terbuka" ON photo_selections;

CREATE POLICY "Klien dapat melihat pilihan galeri publik" ON photo_selections
FOR SELECT TO anon, authenticated
USING (public.gallery_is_public(gallery_id));

CREATE POLICY "Klien dapat menambah pilihan galeri terbuka" ON photo_selections
FOR INSERT TO anon, authenticated
WITH CHECK (
  public.gallery_accepts_selection(gallery_id)
  AND public.photo_belongs_to_gallery(gallery_photo_id, gallery_id)
);

CREATE POLICY "Klien dapat menghapus pilihan galeri terbuka" ON photo_selections
FOR DELETE TO anon, authenticated
USING (public.gallery_accepts_selection(gallery_id));

-- ============================================================================
-- 5. TRIGGER BATAS PILIHAN (diperbaiki)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_selection_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_limit INT;
  current_count INT;
BEGIN
  -- Kunci baris galeri untuk mencegah race condition
  SELECT max_photos_selectable INTO max_limit
  FROM galleries
  WHERE id = NEW.gallery_id
  FOR UPDATE;

  -- Baris yang sudah ada tidak menambah jumlah (kasus upsert dari RPC kirim pilihan)
  IF EXISTS (
    SELECT 1 FROM photo_selections
    WHERE gallery_id = NEW.gallery_id
      AND gallery_photo_id = NEW.gallery_photo_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM photo_selections
  WHERE gallery_id = NEW.gallery_id;

  IF max_limit IS NOT NULL AND max_limit > 0 AND current_count >= max_limit THEN
    RAISE EXCEPTION 'Batas maksimal pilihan foto telah tercapai (maksimal % foto)', max_limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_selection_limit ON photo_selections;
CREATE TRIGGER enforce_selection_limit
BEFORE INSERT ON photo_selections
FOR EACH ROW
EXECUTE FUNCTION public.check_selection_limit();

-- ============================================================================
-- 6. TRIGGER selected_count
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_gallery_selected_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gallery_id UUID;
BEGIN
  v_gallery_id := COALESCE(NEW.gallery_id, OLD.gallery_id);

  UPDATE galleries
  SET selected_count = (
    SELECT COUNT(*) FROM photo_selections WHERE gallery_id = v_gallery_id
  )
  WHERE id = v_gallery_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_selected_count ON photo_selections;
CREATE TRIGGER trg_sync_selected_count
AFTER INSERT OR DELETE ON photo_selections
FOR EACH ROW
EXECUTE FUNCTION public.sync_gallery_selected_count();

-- Hitung ulang data lama
UPDATE galleries g
SET selected_count = (SELECT COUNT(*) FROM photo_selections ps WHERE ps.gallery_id = g.id);

-- ============================================================================
-- 7. RPC submit_gallery_selection (boleh memperbarui setelah terkirim)
-- ============================================================================
CREATE OR REPLACE FUNCTION submit_gallery_selection(
  p_slug TEXT,
  p_selected_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gallery RECORD;
  v_phone TEXT;
  v_studio_name TEXT;
  v_actual_count INT;
  v_was_completed BOOLEAN;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- 1. Validasi galeri dan kunci baris untuk mencegah kirim ganda serentak
  SELECT
    g.id,
    g.status,
    g.max_photos_selectable,
    g.deadline_date,
    g.submitted_at,
    g.user_id
  INTO v_gallery
  FROM galleries g
  WHERE g.client_slug = p_slug
  FOR UPDATE;

  IF v_gallery.id IS NULL OR v_gallery.status = 'draft' THEN
    RAISE EXCEPTION 'Galeri tidak ditemukan atau tautan tidak valid.';
  END IF;

  v_was_completed := (v_gallery.status = 'completed');

  -- 2. Data kontak fotografer
  SELECT
    COALESCE(u.raw_user_meta_data->>'whatsapp_number', ''),
    COALESCE(u.raw_user_meta_data->>'studio_name', 'Studio')
  INTO v_phone, v_studio_name
  FROM auth.users u
  WHERE u.id = v_gallery.user_id;

  -- 3. Tenggat (sampai akhir hari tenggat, waktu WIB)
  IF v_gallery.deadline_date IS NOT NULL
     AND v_gallery.deadline_date < (v_now AT TIME ZONE 'Asia/Jakarta')::date THEN
    RAISE EXCEPTION 'Batas waktu pemilihan foto untuk galeri ini telah berakhir.';
  END IF;

  -- 4. Validasi jumlah (foto unik)
  SELECT COUNT(DISTINCT x) INTO v_actual_count FROM unnest(p_selected_ids) AS x;

  IF COALESCE(v_actual_count, 0) = 0 THEN
    RAISE EXCEPTION 'Belum ada foto yang dipilih. Silakan pilih minimal satu foto sebelum mengirim.';
  END IF;

  IF v_gallery.max_photos_selectable > 0 AND v_actual_count > v_gallery.max_photos_selectable THEN
    RAISE EXCEPTION 'Jumlah foto yang dipilih (%) melebihi kuota maksimal (%).',
      v_actual_count, v_gallery.max_photos_selectable;
  END IF;

  -- 5. Semua foto harus milik galeri ini
  IF EXISTS (
    SELECT 1
    FROM unnest(p_selected_ids) AS x
    WHERE NOT EXISTS (
      SELECT 1 FROM gallery_photos gp
      WHERE gp.id = x AND gp.gallery_id = v_gallery.id
    )
  ) THEN
    RAISE EXCEPTION 'Sebagian foto yang dipilih tidak ditemukan di galeri ini.';
  END IF;

  -- 6. Sinkronkan pilihan: hapus yang tidak lagi dipilih, upsert sisanya dengan urutan
  DELETE FROM photo_selections
  WHERE gallery_id = v_gallery.id
    AND gallery_photo_id != ALL(p_selected_ids);

  INSERT INTO photo_selections (gallery_id, gallery_photo_id, selection_order)
  SELECT v_gallery.id, t.id, (row_number() OVER (ORDER BY MIN(t.ord)))::INT
  FROM unnest(p_selected_ids) WITH ORDINALITY AS t(id, ord)
  GROUP BY t.id
  ON CONFLICT (gallery_id, gallery_photo_id)
  DO UPDATE SET selection_order = EXCLUDED.selection_order;

  -- 7. Catat pengiriman (tidak mengunci; klien boleh memperbarui lagi)
  UPDATE galleries
  SET
    status = 'completed',
    submitted_at = v_now,
    selected_count = v_actual_count,
    updated_at = v_now
  WHERE id = v_gallery.id;

  RETURN jsonb_build_object(
    'success', true,
    'already_completed', v_was_completed,
    'submitted_at', v_now,
    'selected_count', v_actual_count,
    'photographer_phone', v_phone,
    'studio_name', v_studio_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_gallery_selection(TEXT, UUID[]) TO anon, authenticated;

-- ============================================================================
-- 8. PEMERIKSAAN (dikomentari; jalankan manual sebagai anon setelah migrasi)
-- ============================================================================
-- Harus mengembalikan 0 baris / error izin:
--   SELECT album_token, album_pin_hash, client_whatsapp FROM galleries LIMIT 5;
--   SELECT * FROM gallery_photos LIMIT 5;
-- Harus tetap bekerja:
--   SELECT * FROM get_public_gallery('slug-galeri-contoh');
--   SELECT * FROM get_public_gallery_photos('slug-galeri-contoh');
