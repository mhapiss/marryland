-- Migration: Fix RLS Portfolio Collections & Portfolio Photos (2026-10-05)
-- Tujuan: Menghilangkan error 401 (42501 permission denied for table profiles)
--         untuk pengunjung publik (role anon) dan mengganti raw subquery profiles
--         dengan fungsi SECURITY DEFINER public.is_admin().
--
-- Karakteristik:
-- - Idempoten (aman dijalankan berulang kali tanpa error)
-- - Role-separated: SELECT anon hanya memeriksa kolom status (tanpa overhead auth / profiles)
-- - Bebas rekursi RLS
-- - Aman search_path (public)

-- ============================================================================
-- 0. PASTIKAN FUNGSI HELPER is_admin() TERDEFINISI & MEMILIKI IZIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ============================================================================
-- 1. FIX RLS: public.portfolio_collections
-- ============================================================================

ALTER TABLE public.portfolio_collections ENABLE ROW LEVEL SECURITY;

-- Drop seluruh policy lama & variannya
DROP POLICY IF EXISTS "Public can view published collections" ON public.portfolio_collections;
DROP POLICY IF EXISTS "Admin can insert collections" ON public.portfolio_collections;
DROP POLICY IF EXISTS "Admin can update collections" ON public.portfolio_collections;
DROP POLICY IF EXISTS "Admin can delete collections" ON public.portfolio_collections;
DROP POLICY IF EXISTS "Anon can view published collections" ON public.portfolio_collections;
DROP POLICY IF EXISTS "Authenticated can view published or admin collections" ON public.portfolio_collections;
DROP POLICY IF EXISTS "Admin can manage collections" ON public.portfolio_collections;

-- Policy SELECT untuk Anonim: HANYA koleksi yang berstatus 'published'
-- (Tidak menyentuh tabel profiles sama sekali, bebas error 42501)
CREATE POLICY "Anon can view published collections"
  ON public.portfolio_collections
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Policy SELECT untuk Authenticated: Published atau jika user adalah admin
CREATE POLICY "Authenticated can view published or admin collections"
  ON public.portfolio_collections
  FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.is_admin());

-- Policy INSERT untuk Admin
CREATE POLICY "Admin can insert collections"
  ON public.portfolio_collections
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy UPDATE untuk Admin
CREATE POLICY "Admin can update collections"
  ON public.portfolio_collections
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy DELETE untuk Admin
CREATE POLICY "Admin can delete collections"
  ON public.portfolio_collections
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Pastikan hak akses tabel
GRANT SELECT ON public.portfolio_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_collections TO authenticated;

-- ============================================================================
-- 2. FIX RLS: public.portfolio_photos
-- ============================================================================

ALTER TABLE public.portfolio_photos ENABLE ROW LEVEL SECURITY;

-- Drop seluruh policy lama & variannya
DROP POLICY IF EXISTS "Public can view published portfolio" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Admin can insert portfolio" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Admin can update portfolio" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Admin can delete portfolio" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Anon can view published photos" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Authenticated can view published or admin photos" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Admin can manage portfolio photos" ON public.portfolio_photos;

-- Policy SELECT untuk Anonim: HANYA foto yang dipublikasikan (is_published = true)
CREATE POLICY "Anon can view published photos"
  ON public.portfolio_photos
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Policy SELECT untuk Authenticated: Published atau jika user adalah admin
CREATE POLICY "Authenticated can view published or admin photos"
  ON public.portfolio_photos
  FOR SELECT
  TO authenticated
  USING (is_published = true OR public.is_admin());

-- Policy INSERT untuk Admin
CREATE POLICY "Admin can insert portfolio"
  ON public.portfolio_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy UPDATE untuk Admin
CREATE POLICY "Admin can update portfolio"
  ON public.portfolio_photos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy DELETE untuk Admin
CREATE POLICY "Admin can delete portfolio"
  ON public.portfolio_photos
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Pastikan hak akses tabel
GRANT SELECT ON public.portfolio_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_photos TO authenticated;

-- ============================================================================
-- 3. TEST / VERIFIKASI QUERY (Dapat dijalankan di Supabase SQL Editor)
-- ============================================================================
-- DO $$
-- BEGIN
--   RAISE NOTICE 'Verifikasi RLS Portfolio Berhasil Dijalankan.';
-- END $$;
