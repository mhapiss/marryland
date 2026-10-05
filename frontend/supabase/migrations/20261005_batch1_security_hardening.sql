-- Migration: Batch 1 - Supabase Security Hardening (2026-10-05)
-- DO NOT RUN DIRECTLY. Review and execute in Supabase SQL Editor.
--
-- Cakupan Perubahan:
-- 1. [C1] Menutup seluruh SELECT langsung anon pada tabel galleries dan gallery_photos
--    untuk mencegah enumerasi dan kebocoran kolom privat (client_whatsapp, album_token,
--    album_pin_hash, gdrive_folder_url).
-- 2. [C2] Mengaktifkan dan mengonfigurasi RLS pada storage.objects untuk bucket home-media,
--    portfolio, dan media-library (hanya publik read, tulis dibatasi ke admin/fotografer pemilik).
-- 3. [C3] Menambahkan SET search_path = public pada seluruh fungsi SECURITY DEFINER untuk
--    mencegah search_path hijacking.
-- 4. [C4] Mengoptimasi kebijakan RLS yang menggunakan auth.uid() menjadi (SELECT auth.uid())
--    untuk mencegah evaluasi berulang per-baris (N-times evaluation).
-- 5. [C5] Menambahkan index foreign key pada photo_selections(gallery_photo_id) untuk
--    mempercepat JOIN dan proses CASCADE ON DELETE.
-- 6. Memastikan seluruh RPC publik (get_public_gallery, get_public_gallery_photos,
--    get_family_album, submit_gallery_selection, resolve_slug_redirect) beroperasi secara
--    aman, idempoten, dan hanya mengekspos data yang diizinkan untuk galeri aktif/selesai.

-- ============================================================================
-- 0. EKSTENSI & KOLOM
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.galleries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 1. [C3] FUNGSI PEMBANTU & ROLE ADMIN DENGAN SEARCH_PATH EKSPLISIT
-- ============================================================================

-- Fungsi cek admin (SECURITY DEFINER dengan search_path aman)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Fungsi trigger pendaftaran user baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'photographer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fungsi pemeriksa status publik galeri untuk RLS photo_selections
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

-- Fungsi pemeriksa apakah galeri masih menerima pilihan foto
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

-- Fungsi validasi kepemilikan foto dalam galeri
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
-- 2. [C1 & C4] TUTUP SELECT LANGSUNG ANON & OPTIMASI RLS GALLERIES
-- ============================================================================
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

-- Cabut seluruh policy anon/public yang membuka akses langsung ke tabel galleries
DROP POLICY IF EXISTS "Anon can view active and completed galleries" ON public.galleries;
DROP POLICY IF EXISTS "Public bisa melihat galeri" ON public.galleries;
DROP POLICY IF EXISTS "Fotografer bisa melihat galerinya sendiri" ON public.galleries;
DROP POLICY IF EXISTS "Fotografer bisa menambah galeri" ON public.galleries;
DROP POLICY IF EXISTS "Fotografer bisa mengubah galerinya sendiri" ON public.galleries;
DROP POLICY IF EXISTS "Fotografer bisa menghapus galerinya sendiri" ON public.galleries;
DROP POLICY IF EXISTS "Admin bisa melihat semua galeri" ON public.galleries;
DROP POLICY IF EXISTS "Admin bisa update semua galeri" ON public.galleries;
DROP POLICY IF EXISTS "Admin has full access to galleries" ON public.galleries;

-- Kebijakan untuk fotografer pemilik (menggunakan (SELECT auth.uid()))
CREATE POLICY "Fotografer bisa melihat galerinya sendiri" ON public.galleries
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Fotografer bisa menambah galeri" ON public.galleries
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Fotografer bisa mengubah galerinya sendiri" ON public.galleries
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Fotografer bisa menghapus galerinya sendiri" ON public.galleries
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Kebijakan untuk admin
CREATE POLICY "Admin has full access to galleries" ON public.galleries
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. [C1 & C4] TUTUP SELECT LANGSUNG ANON & OPTIMASI RLS GALLERY_PHOTOS
-- ============================================================================
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can view photos of active and completed galleries" ON public.gallery_photos;
DROP POLICY IF EXISTS "Public bisa melihat foto galeri" ON public.gallery_photos;
DROP POLICY IF EXISTS "Fotografer bisa melihat foto galerinya" ON public.gallery_photos;
DROP POLICY IF EXISTS "Fotografer bisa menambah foto ke galerinya" ON public.gallery_photos;
DROP POLICY IF EXISTS "Fotografer bisa mengubah foto galerinya" ON public.gallery_photos;
DROP POLICY IF EXISTS "Fotografer bisa menghapus foto galerinya" ON public.gallery_photos;
DROP POLICY IF EXISTS "Admin bisa melihat semua foto galeri" ON public.gallery_photos;
DROP POLICY IF EXISTS "Admin has full access to gallery_photos" ON public.gallery_photos;

CREATE POLICY "Fotografer bisa melihat foto galerinya" ON public.gallery_photos
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = gallery_photos.gallery_id
      AND g.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Fotografer bisa menambah foto ke galerinya" ON public.gallery_photos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = gallery_photos.gallery_id
      AND g.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Fotografer bisa mengubah foto galerinya" ON public.gallery_photos
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = gallery_photos.gallery_id
      AND g.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Fotografer bisa menghapus foto galerinya" ON public.gallery_photos
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = gallery_photos.gallery_id
      AND g.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admin has full access to gallery_photos" ON public.gallery_photos
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. [C4] KEBIJAKAN RLS PHOTO_SELECTIONS
-- ============================================================================
ALTER TABLE public.photo_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can view selections of active and completed galleries" ON public.photo_selections;
DROP POLICY IF EXISTS "Anon can insert selections if gallery is active" ON public.photo_selections;
DROP POLICY IF EXISTS "Anon can delete selections if gallery is active" ON public.photo_selections;
DROP POLICY IF EXISTS "Klien dapat melihat pilihan galeri publik" ON public.photo_selections;
DROP POLICY IF EXISTS "Klien dapat menambah pilihan galeri terbuka" ON public.photo_selections;
DROP POLICY IF EXISTS "Klien dapat menghapus pilihan galeri terbuka" ON public.photo_selections;
DROP POLICY IF EXISTS "Fotografer bisa mengelola pilihan galerinya" ON public.photo_selections;
DROP POLICY IF EXISTS "Admin bisa melihat semua seleksi" ON public.photo_selections;
DROP POLICY IF EXISTS "Admin has full access to photo_selections" ON public.photo_selections;

-- Akses aman klien melalui helper SECURITY DEFINER (tidak memerlukan direct SELECT pada galleries)
CREATE POLICY "Klien dapat melihat pilihan galeri publik" ON public.photo_selections
FOR SELECT TO anon, authenticated
USING (public.gallery_is_public(gallery_id));

CREATE POLICY "Klien dapat menambah pilihan galeri terbuka" ON public.photo_selections
FOR INSERT TO anon, authenticated
WITH CHECK (
  public.gallery_accepts_selection(gallery_id)
  AND public.photo_belongs_to_gallery(gallery_photo_id, gallery_id)
);

CREATE POLICY "Klien dapat menghapus pilihan galeri terbuka" ON public.photo_selections
FOR DELETE TO anon, authenticated
USING (public.gallery_accepts_selection(gallery_id));

-- Fotografer pemilik
CREATE POLICY "Fotografer bisa mengelola pilihan galerinya" ON public.photo_selections
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = photo_selections.gallery_id
      AND g.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.galleries g
    WHERE g.id = photo_selections.gallery_id
      AND g.user_id = (SELECT auth.uid())
  )
);

-- Admin
CREATE POLICY "Admin has full access to photo_selections" ON public.photo_selections
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 5. [C4] OPTIMASI RLS PROFILES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Admin can read all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin can update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 6. [C5] INDEKS FOREIGN KEY & FILTER QUERY
-- ============================================================================
-- Foreign key photo_selections -> gallery_photos(id) (C5: mencegah sequential scan saat DELETE cascade / JOIN)
CREATE INDEX IF NOT EXISTS idx_photo_selections_photo_id 
  ON public.photo_selections(gallery_photo_id);

CREATE INDEX IF NOT EXISTS idx_photo_selections_gallery_order 
  ON public.photo_selections(gallery_id, selection_order);

CREATE INDEX IF NOT EXISTS idx_galleries_user_id 
  ON public.galleries(user_id);

CREATE INDEX IF NOT EXISTS idx_galleries_status 
  ON public.galleries(status);

CREATE INDEX IF NOT EXISTS idx_galleries_client_slug 
  ON public.galleries(client_slug);

CREATE INDEX IF NOT EXISTS idx_galleries_album_token 
  ON public.galleries(album_token);

CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery_id 
  ON public.gallery_photos(gallery_id);

-- ============================================================================
-- 7. [C3] TRIGGER INTEGRITAS & KUOTA PEMILIHAN
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
  FROM public.galleries
  WHERE id = NEW.gallery_id
  FOR UPDATE;

  -- Jika baris sudah ada (upsert), tidak menambah kuota
  IF EXISTS (
    SELECT 1 FROM public.photo_selections
    WHERE gallery_id = NEW.gallery_id
      AND gallery_photo_id = NEW.gallery_photo_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.photo_selections
  WHERE gallery_id = NEW.gallery_id;

  IF max_limit IS NOT NULL AND max_limit > 0 AND current_count >= max_limit THEN
    RAISE EXCEPTION 'Batas maksimal pilihan foto telah tercapai (maksimal % foto)', max_limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_selection_limit ON public.photo_selections;
CREATE TRIGGER enforce_selection_limit
BEFORE INSERT ON public.photo_selections
FOR EACH ROW
EXECUTE FUNCTION public.check_selection_limit();

-- Trigger sinkronisasi selected_count otomatis
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

  UPDATE public.galleries
  SET selected_count = (
    SELECT COUNT(*) FROM public.photo_selections WHERE gallery_id = v_gallery_id
  )
  WHERE id = v_gallery_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_selected_count ON public.photo_selections;
CREATE TRIGGER trg_sync_selected_count
AFTER INSERT OR DELETE ON public.photo_selections
FOR EACH ROW
EXECUTE FUNCTION public.sync_gallery_selected_count();

-- Hitung ulang data existing
UPDATE public.galleries g
SET selected_count = (SELECT COUNT(*) FROM public.photo_selections ps WHERE ps.gallery_id = g.id);

-- ============================================================================
-- 8. [C1 & C3] RPC PUBLIK AMAN: get_public_gallery
-- ============================================================================
-- Catatan: Hanya mengembalikan kolom aman.
-- Kolom privat: client_whatsapp, album_token, album_pin_hash, gdrive_folder_url TIDAK PERNAH dikembalikan.
DROP FUNCTION IF EXISTS public.get_public_gallery(TEXT);

CREATE OR REPLACE FUNCTION public.get_public_gallery(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  client_name TEXT,
  client_slug TEXT,
  event_date DATE,
  max_photos_selectable INT,
  deadline_date DATE,
  highlight_description TEXT,
  allow_download BOOLEAN,
  status TEXT,
  selected_count INT,
  album_enabled BOOLEAN,
  submitted_at TIMESTAMPTZ,
  studio_name TEXT,
  studio_logo TEXT,
  accent_color TEXT,
  photographer_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.client_name,
    g.client_slug,
    g.event_date,
    g.max_photos_selectable,
    g.deadline_date,
    g.highlight_description,
    g.allow_download,
    g.status,
    g.selected_count,
    g.album_enabled,
    g.submitted_at,
    COALESCE(u.raw_user_meta_data->>'studio_name', 'Studio') AS studio_name,
    COALESCE(u.raw_user_meta_data->>'studio_logo', '') AS studio_logo,
    COALESCE(u.raw_user_meta_data->>'accent_color', '#9B2C24') AS accent_color,
    COALESCE(u.raw_user_meta_data->>'whatsapp_number', '') AS photographer_phone
  FROM public.galleries g
  LEFT JOIN auth.users u ON u.id = g.user_id
  WHERE g.client_slug = p_slug
    AND g.status IN ('active', 'completed')
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_gallery(TEXT) TO anon, authenticated;

-- ============================================================================
-- 9. [C1 & C3] RPC PUBLIK AMAN: get_public_gallery_photos
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_public_gallery_photos(TEXT);

CREATE OR REPLACE FUNCTION public.get_public_gallery_photos(p_slug TEXT)
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gallery_id UUID;
BEGIN
  -- Pastikan galeri ada dan berstatus active atau completed (bukan draft)
  SELECT g.id INTO v_gallery_id 
  FROM public.galleries g 
  WHERE g.client_slug = p_slug
    AND g.status IN ('active', 'completed');

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
  FROM public.gallery_photos gp
  WHERE gp.gallery_id = v_gallery_id
  ORDER BY gp.order_index ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_gallery_photos(TEXT) TO anon, authenticated;

-- ============================================================================
-- 10. [C1 & C3] RPC PUBLIK AMAN: get_family_album
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_family_album(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_family_album(
  p_slug TEXT,
  p_token TEXT,
  p_pin TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gallery RECORD;
  v_cover_url TEXT := NULL;
  v_photos JSONB;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_lock_remaining_seconds INT := 0;
BEGIN
  -- 1. Cari galeri berdasarkan slug
  SELECT 
    g.*,
    u.raw_user_meta_data->>'studio_name' AS photographer_studio
  INTO v_gallery
  FROM public.galleries g
  LEFT JOIN auth.users u ON u.id = g.user_id
  WHERE g.client_slug = p_slug
    AND g.status IN ('active', 'completed');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'GALLERY_NOT_FOUND', 'message', 'Galeri tidak ditemukan.');
  END IF;

  -- 2. Cek apakah fitur album diaktifkan
  IF NOT v_gallery.album_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALBUM_DISABLED', 'message', 'Album keluarga belum diaktifkan oleh fotografer.');
  END IF;

  -- 3. Cek kesesuaian token
  IF v_gallery.album_token IS NULL OR v_gallery.album_token != p_token THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN', 'message', 'Tautan album tidak valid atau telah diperbarui.');
  END IF;

  -- 4. Cek kedaluwarsa
  IF v_gallery.album_expires_at IS NOT NULL AND v_gallery.album_expires_at < v_now THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALBUM_EXPIRED', 'message', 'Tautan album ini telah kedaluwarsa.');
  END IF;

  -- 5. Cek proteksi kunci PIN akibat salah percobaan berulang
  IF v_gallery.album_pin_locked_until IS NOT NULL AND v_gallery.album_pin_locked_until > v_now THEN
    v_lock_remaining_seconds := EXTRACT(EPOCH FROM (v_gallery.album_pin_locked_until - v_now))::INT;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'PIN_LOCKED',
      'message', 'Terlalu banyak percobaan PIN salah. Album terkunci sementara demi keamanan.',
      'lock_remaining_seconds', v_lock_remaining_seconds
    );
  END IF;

  -- 6. Verifikasi proteksi PIN jika diaktifkan
  IF v_gallery.album_pin_hash IS NOT NULL AND v_gallery.album_pin_hash != '' THEN
    IF p_pin IS NULL OR trim(p_pin) = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'PIN_REQUIRED',
        'message', 'Album ini dilindungi PIN oleh fotografer.',
        'album_title', v_gallery.client_name,
        'studio_name', COALESCE(v_gallery.photographer_studio, 'by.marryland')
      );
    END IF;

    IF v_gallery.album_pin_hash != encode(digest(p_pin || 'marryland_pin_salt', 'sha256'), 'hex') THEN
      UPDATE public.galleries
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
      -- Reset status gagal setelah PIN benar
      UPDATE public.galleries 
      SET album_pin_failed_attempts = 0, album_pin_locked_until = NULL 
      WHERE id = v_gallery.id;
    END IF;
  END IF;

  -- 7. Dapatkan cover foto jika ditentukan
  IF v_gallery.album_cover_photo_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_cover_url 
    FROM public.gallery_photos 
    WHERE id = v_gallery.album_cover_photo_id;
  END IF;

  -- 8. Ambil daftar foto berdasarkan cakupan album (hanya foto terpilih atau seluruh foto)
  IF v_gallery.album_scope = 'selected_only' THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', gp.id,
        'gdrive_file_id', gp.gdrive_file_id,
        'filename', gp.filename,
        'thumbnail_url', gp.thumbnail_url,
        'order_index', ps.selection_order,
        'is_missing', COALESCE(gp.is_missing, false),
        'width', gp.width,
        'height', gp.height,
        'rotation', COALESCE(gp.rotation, 0)
      ) ORDER BY ps.selection_order ASC
    ) INTO v_photos
    FROM public.photo_selections ps
    JOIN public.gallery_photos gp ON gp.id = ps.gallery_photo_id
    WHERE ps.gallery_id = v_gallery.id;
  ELSE
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', gp.id,
        'gdrive_file_id', gp.gdrive_file_id,
        'filename', gp.filename,
        'thumbnail_url', gp.thumbnail_url,
        'order_index', gp.order_index,
        'is_missing', COALESCE(gp.is_missing, false),
        'width', gp.width,
        'height', gp.height,
        'rotation', COALESCE(gp.rotation, 0)
      ) ORDER BY gp.order_index ASC
    ) INTO v_photos
    FROM public.gallery_photos gp
    WHERE gp.gallery_id = v_gallery.id;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.get_family_album(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- 11. [C3] RPC PENGIRIMAN PILIHAN: submit_gallery_selection
-- ============================================================================
DROP FUNCTION IF EXISTS public.submit_gallery_selection(TEXT, UUID[]);

CREATE OR REPLACE FUNCTION public.submit_gallery_selection(
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
  -- 1. Validasi galeri dan kunci baris untuk mencegah balapan (race condition)
  SELECT
    g.id,
    g.status,
    g.max_photos_selectable,
    g.deadline_date,
    g.submitted_at,
    g.user_id
  INTO v_gallery
  FROM public.galleries g
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

  -- 3. Tenggat waktu pemilihan (waktu WIB)
  IF v_gallery.deadline_date IS NOT NULL
     AND v_gallery.deadline_date < (v_now AT TIME ZONE 'Asia/Jakarta')::date THEN
    RAISE EXCEPTION 'Batas waktu pemilihan foto untuk galeri ini telah berakhir.';
  END IF;

  -- 4. Validasi jumlah pilihan foto
  SELECT COUNT(DISTINCT x) INTO v_actual_count FROM unnest(p_selected_ids) AS x;

  IF COALESCE(v_actual_count, 0) = 0 THEN
    RAISE EXCEPTION 'Belum ada foto yang dipilih. Silakan pilih minimal satu foto sebelum mengirim.';
  END IF;

  IF v_gallery.max_photos_selectable > 0 AND v_actual_count > v_gallery.max_photos_selectable THEN
    RAISE EXCEPTION 'Jumlah foto yang dipilih (%) melebihi kuota maksimal (%).',
      v_actual_count, v_gallery.max_photos_selectable;
  END IF;

  -- 5. Validasi bahwa seluruh foto yang dipilih benar-benar milik galeri ini
  IF EXISTS (
    SELECT 1
    FROM unnest(p_selected_ids) AS x
    WHERE NOT EXISTS (
      SELECT 1 FROM public.gallery_photos gp
      WHERE gp.id = x AND gp.gallery_id = v_gallery.id
    )
  ) THEN
    RAISE EXCEPTION 'Sebagian foto yang dipilih tidak ditemukan di galeri ini.';
  END IF;

  -- 6. Sinkronisasi pilihan foto
  DELETE FROM public.photo_selections
  WHERE gallery_id = v_gallery.id
    AND gallery_photo_id != ALL(p_selected_ids);

  INSERT INTO public.photo_selections (gallery_id, gallery_photo_id, selection_order)
  SELECT v_gallery.id, t.id, (row_number() OVER (ORDER BY MIN(t.ord)))::INT
  FROM unnest(p_selected_ids) WITH ORDINALITY AS t(id, ord)
  GROUP BY t.id
  ON CONFLICT (gallery_id, gallery_photo_id)
  DO UPDATE SET selection_order = EXCLUDED.selection_order;

  -- 7. Perbarui status galeri
  UPDATE public.galleries
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

GRANT EXECUTE ON FUNCTION public.submit_gallery_selection(TEXT, UUID[]) TO anon, authenticated;

-- ============================================================================
-- 12. [C3] HELPER REDIRECT SLUG: resolve_slug_redirect
-- ============================================================================
DROP FUNCTION IF EXISTS public.resolve_slug_redirect(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.resolve_slug_redirect(
  p_entity_type TEXT,
  p_old_slug TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_slug TEXT;
BEGIN
  SELECT new_slug INTO v_new_slug
  FROM public.slug_redirects
  WHERE entity_type = p_entity_type AND old_slug = p_old_slug
  LIMIT 1;

  RETURN v_new_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_slug_redirect(TEXT, TEXT) TO anon, authenticated;

-- ============================================================================
-- 13. [C3] VERSION BUMP KONTEN SITUS
-- ============================================================================
-- Lepaskan trigger lama jika ada agar tipe kembalian bump_site_content_version dapat diubah
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'page_content') THEN
    DROP TRIGGER IF EXISTS trigger_bump_version_page ON public.page_content;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
    DROP TRIGGER IF EXISTS trigger_bump_version_settings ON public.site_settings;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.bump_site_content_version();

-- Fungsi khusus untuk trigger
CREATE OR REPLACE FUNCTION public.trigger_bump_site_content_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_meta') THEN
    UPDATE public.site_meta
    SET content_version = content_version + 1, updated_at = now()
    WHERE id = 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Pasang kembali trigger jika tabel terkait ada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'page_content') THEN
    CREATE TRIGGER trigger_bump_version_page
      AFTER UPDATE OR INSERT ON public.page_content
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_bump_site_content_version();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
    CREATE TRIGGER trigger_bump_version_settings
      AFTER UPDATE ON public.site_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_bump_site_content_version();
  END IF;
END $$;

-- RPC mandiri yang dapat dipanggil frontend
CREATE OR REPLACE FUNCTION public.bump_site_content_version()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_meta') THEN
    UPDATE public.site_meta
    SET content_version = content_version + 1, updated_at = now()
    WHERE id = 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_site_content_version() TO authenticated;

-- ============================================================================
-- 14. [C2] STORAGE HARDENING (home-media, portfolio, media-library)
-- ============================================================================
-- Pastikan ketiga bucket terdaftar dan berstatus publik untuk pembacaan CDN
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('home-media', 'home-media', true),
  ('portfolio', 'portfolio', true),
  ('media-library', 'media-library', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Aktifkan RLS pada tabel storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Public can view home-media, portfolio, and media-library" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owners can upload storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owners can update storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owners can delete storage objects" ON storage.objects;

-- 1. Baca (SELECT): Publik (anon dan authenticated) hanya boleh membaca objek pada ketiga bucket ini
CREATE POLICY "Public can view home-media, portfolio, and media-library"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('home-media', 'portfolio', 'media-library'));

-- 2. Tulis (INSERT): Admin boleh menulis ke semua bucket; Fotografer hanya boleh menulis ke portfolio/logos/id-user
CREATE POLICY "Admin and owners can upload storage objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('home-media', 'portfolio', 'media-library')
  AND (
    public.is_admin()
    OR (
      bucket_id = 'portfolio'
      AND name LIKE 'logos/' || (SELECT auth.uid())::text || '%'
    )
  )
);

-- 3. Ubah (UPDATE): Admin dan pemilik logo
CREATE POLICY "Admin and owners can update storage objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('home-media', 'portfolio', 'media-library')
  AND (
    public.is_admin()
    OR (
      bucket_id = 'portfolio'
      AND name LIKE 'logos/' || (SELECT auth.uid())::text || '%'
    )
  )
);

-- 4. Hapus (DELETE): Admin dan pemilik logo
CREATE POLICY "Admin and owners can delete storage objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('home-media', 'portfolio', 'media-library')
  AND (
    public.is_admin()
    OR (
      bucket_id = 'portfolio'
      AND name LIKE 'logos/' || (SELECT auth.uid())::text || '%'
    )
  )
);
