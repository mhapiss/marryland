-- Migration: 20261005_portfolio_category_constraint_fix.sql
-- Description: Relaksasi / pembaruan check constraint kategori pada tabel portfolio_photos
-- agar mendukung kategori adat dan editorial serta tidak menggagalkan upload foto.

DO $$
BEGIN
  -- 1. Hapus constraint lama jika ada
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'portfolio_photos_category_check' 
      AND table_name = 'portfolio_photos'
  ) THEN
    ALTER TABLE public.portfolio_photos DROP CONSTRAINT portfolio_photos_category_check;
  END IF;

  -- 2. Tambahkan constraint baru yang lebih fleksibel
  ALTER TABLE public.portfolio_photos 
    ADD CONSTRAINT portfolio_photos_category_check 
    CHECK (category IN ('pernikahan', 'wisuda', 'keluarga', 'adat', 'wedding', 'umum', 'editorial'));

  -- 3. Pastikan nilai default kolom adalah 'pernikahan'
  ALTER TABLE public.portfolio_photos 
    ALTER COLUMN category SET DEFAULT 'pernikahan';

END $$;
