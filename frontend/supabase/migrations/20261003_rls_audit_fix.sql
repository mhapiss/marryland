-- Migration: RLS Audit & Fixes
-- DO NOT RUN. For review only.

-- ==========================================
-- 1. FIX UNIQUE CONSTRAINT PADA PHOTO SELECTIONS
-- ==========================================
-- Mencegah foto yang sama dipilih dua kali dalam satu galeri
ALTER TABLE photo_selections
ADD CONSTRAINT unique_photo_selection UNIQUE (gallery_id, gallery_photo_id);

-- ==========================================
-- 2. FIX BATAS MAKSIMAL PILIHAN (TRIGGER)
-- ==========================================
-- Mencegah insert jika jumlah foto yang dipilih sudah mencapai batas maksimal
CREATE OR REPLACE FUNCTION check_selection_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_limit INT;
  current_count INT;
BEGIN
  -- Dapatkan batas maksimal galeri
  SELECT max_photos_selectable INTO max_limit
  FROM galleries
  WHERE id = NEW.gallery_id;

  -- Hitung jumlah pilihan saat ini (tanpa record yang baru)
  SELECT COUNT(*) INTO current_count
  FROM photo_selections
  WHERE gallery_id = NEW.gallery_id;

  IF current_count >= max_limit THEN
    RAISE EXCEPTION 'Batas maksimal foto yang dapat dipilih telah tercapai (%)', max_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_selection_limit ON photo_selections;
CREATE TRIGGER enforce_selection_limit
BEFORE INSERT ON photo_selections
FOR EACH ROW
EXECUTE FUNCTION check_selection_limit();

-- ==========================================
-- 3. PERBAIKAN RLS POLICIES
-- ==========================================

-- Hapus policy anonim lama yang terlalu longgar
DROP POLICY IF EXISTS "Public bisa melihat galeri" ON galleries;
DROP POLICY IF EXISTS "Public bisa melihat foto galeri" ON gallery_photos;
DROP POLICY IF EXISTS "Public bisa membuat pilihan foto" ON photo_selections;
DROP POLICY IF EXISTS "Public bisa menghapus pilihan foto" ON photo_selections;
DROP POLICY IF EXISTS "Public bisa melihat pilihan foto" ON photo_selections;

-- RLS baru untuk anonim (klien):
-- Untuk anonim, secara native Postgres RLS tidak bisa mencegah SELECT * jika policy adalah USING(true), 
-- tetapi karena klien hanya menggunakan anon key, kita biarkan USING(true) untuk read, TAPI dengan catatan
-- di sisi aplikasi, klien HANYA melakukan query `.eq('client_slug', slug)`. 
-- Untuk memperketat, kita pastikan klien tidak bisa mengubah galeri atau menghapus galeri.
CREATE POLICY "Anon can view active and completed galleries" ON galleries 
FOR SELECT TO anon 
USING (status IN ('active', 'completed'));

CREATE POLICY "Anon can view photos of active and completed galleries" ON gallery_photos 
FOR SELECT TO anon 
USING (
  EXISTS (
    SELECT 1 FROM galleries 
    WHERE galleries.id = gallery_photos.gallery_id 
    AND galleries.status IN ('active', 'completed')
  )
);

CREATE POLICY "Anon can view selections of active and completed galleries" ON photo_selections 
FOR SELECT TO anon 
USING (
  EXISTS (
    SELECT 1 FROM galleries 
    WHERE galleries.id = photo_selections.gallery_id 
    AND galleries.status IN ('active', 'completed')
  )
);

-- Klien hanya boleh insert dan delete ke photo_selections JIKA status galeri = active (belum completed)
CREATE POLICY "Anon can insert selections if gallery is active" ON photo_selections 
FOR INSERT TO anon 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM galleries 
    WHERE galleries.id = photo_selections.gallery_id 
    AND galleries.status = 'active'
  )
);

CREATE POLICY "Anon can delete selections if gallery is active" ON photo_selections 
FOR DELETE TO anon 
USING (
  EXISTS (
    SELECT 1 FROM galleries 
    WHERE galleries.id = photo_selections.gallery_id 
    AND galleries.status = 'active'
  )
);

-- RLS portfolio_photos sudah di-set oleh supabase-migration-admin.sql (is_admin() check)

