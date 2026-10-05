-- Migration: RPC get_selected_filenames (2026-10-05)
-- Tujuan: Mengambil nama file dan urutan pilihan klien untuk galeri tertentu.
-- Hak akses: Hanya pemilik galeri (g.user_id = auth.uid()) atau admin studio (public.is_admin()).
-- STATUS: BELUM DIJALANKAN (review dan jalankan di SQL Editor Supabase).

-- ============================================================================
-- 1. FUNGSI RPC get_selected_filenames
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_selected_filenames(p_gallery_id uuid)
RETURNS TABLE (
  filename text,
  selection_order integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Pemeriksaan izin: hanya pemilik galeri atau admin yang diizinkan
  IF NOT (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.galleries g
      WHERE g.id = p_gallery_id
        AND g.user_id = (SELECT auth.uid())
    )
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya pemilik galeri atau admin yang dapat mengakses daftar nama file pilihan.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT 
    gp.filename::text,
    ps.selection_order::integer
  FROM public.photo_selections ps
  JOIN public.gallery_photos gp ON gp.id = ps.gallery_photo_id
  WHERE ps.gallery_id = p_gallery_id
  ORDER BY ps.selection_order ASC;
END;
$$;

-- Cabut eksekusi dari publik dan anon
REVOKE EXECUTE ON FUNCTION public.get_selected_filenames(uuid) FROM PUBLIC, anon;

-- Berikan izin eksekusi hanya ke authenticated user
GRANT EXECUTE ON FUNCTION public.get_selected_filenames(uuid) TO authenticated;

-- Komentar dokumentasi fungsi
COMMENT ON FUNCTION public.get_selected_filenames(uuid) IS 
  'Mengembalikan daftar nama file foto yang dipilih klien dan urutan pilihannya. Dibatasi untuk pemilik galeri dan admin studio.';

-- ============================================================================
-- 2. QUERY PEMERIKSAAN HAK AKSES & DEFINISI FUNGSI (Untuk Verifikasi DBA)
-- ============================================================================

-- A. Periksa apakah fungsi terdaftar dengan SECURITY DEFINER dan search_path kosong:
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname = 'get_selected_filenames';

-- B. Periksa hak eksekusi (hanya authenticated, anon dan public harus nihil):
-- SELECT grantee, routine_name, privilege_type 
-- FROM information_schema.routine_privileges 
-- WHERE routine_name = 'get_selected_filenames' 
--   AND routine_schema = 'public';

-- C. Uji panggil fungsi sebagai user authenticated pemilik galeri:
-- SELECT * FROM public.get_selected_filenames('<ID_GALERI_VALID>');
