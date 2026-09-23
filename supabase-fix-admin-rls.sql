-- ============================================================
-- FIX: Admin RLS Self-Reference Problem
-- Jalankan di Supabase SQL Editor SETELAH migration pertama
-- ============================================================

-- 1. Buat function SECURITY DEFINER untuk cek admin (bypass RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop old policies yang bermasalah
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin bisa melihat semua galeri" ON galleries;
DROP POLICY IF EXISTS "Admin bisa melihat semua foto galeri" ON gallery_photos;
DROP POLICY IF EXISTS "Admin bisa melihat semua seleksi" ON photo_selections;
DROP POLICY IF EXISTS "Admin can insert portfolio" ON portfolio_photos;
DROP POLICY IF EXISTS "Admin can update portfolio" ON portfolio_photos;
DROP POLICY IF EXISTS "Admin can delete portfolio" ON portfolio_photos;

-- 3. Re-create with is_admin() function (no self-reference)
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin bisa melihat semua galeri" ON galleries
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin bisa melihat semua foto galeri" ON gallery_photos
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin bisa melihat semua seleksi" ON photo_selections
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert portfolio" ON portfolio_photos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update portfolio" ON portfolio_photos
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete portfolio" ON portfolio_photos
  FOR DELETE USING (is_admin());

-- 4. Juga tambah policy agar admin bisa update galleries (untuk admin features nanti)
CREATE POLICY "Admin bisa update semua galeri" ON galleries
  FOR UPDATE USING (is_admin());

-- ============================================================
-- Verifikasi: Cek role admin sudah di-set
-- SELECT id, full_name, role FROM profiles;
-- ============================================================
