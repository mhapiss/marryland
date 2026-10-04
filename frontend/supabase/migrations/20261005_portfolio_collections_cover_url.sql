-- Migration: Tambah kolom cover_url opsional ke tabel portfolio_collections
-- DO NOT RUN DIRECTLY. Review only.
-- Menjaga kompatibilitas jika skema database ingin menyimpan tautan sampul langsung di tabel portfolio_collections.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'portfolio_collections' 
      AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.portfolio_collections ADD COLUMN cover_url text;
  END IF;
END $$;
