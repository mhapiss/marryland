-- ============================================================
-- Migration: Modular Multi-Template Undangan Digital
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Buat Tabel invitation_templates
CREATE TABLE IF NOT EXISTS public.invitation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('elegant', 'minimalist', 'rustic', 'floral', 'islami', 'luxury', 'pastel')),
    layout_key TEXT NOT NULL UNIQUE,
    default_theme_color TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS untuk invitation_templates (Bisa dibaca publik/authenticated, ga bisa diedit)
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are viewable by everyone." ON public.invitation_templates FOR SELECT USING (true);

-- 2. Hapus kolom template_id yang lama (TEXT), tambahkan yang baru (UUID)
-- Pastikan tidak error kalau belum ada atau bertipe beda
DO $$ 
BEGIN 
  -- Hapus kolom template_id yang lama (yang berupa TEXT, dari migrasi sebelumnya)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.invitations DROP COLUMN template_id;
  END IF;
END $$;

ALTER TABLE public.invitations
ADD COLUMN template_id UUID REFERENCES public.invitation_templates(id) ON DELETE RESTRICT;

-- 3. Masukkan Data Bawaan (Seed)
-- Simpan ID menggunakan gen_random_uuid() untuk menghindari hardcode UUID, tapi pastikan hanya insert jika layout_key belum ada.
INSERT INTO public.invitation_templates (name, category, layout_key, default_theme_color, thumbnail_url)
VALUES 
    ('Elegant Floral', 'floral', 'elegant-floral', '#9A8478', 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=600&auto=format&fit=crop'),
    ('Minimalist Modern', 'minimalist', 'minimalist-modern', '#333333', 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop'),
    ('Rustic Vintage', 'rustic', 'rustic-vintage', '#8B5A2B', 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=600&auto=format&fit=crop'),
    ('Nuansa Islami', 'islami', 'islami-green', '#2E5041', 'https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=600&auto=format&fit=crop'),
    ('Luxury Gold', 'luxury', 'luxury-gold', '#D4AF37', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=600&auto=format&fit=crop'),
    ('Pastel Romantic', 'pastel', 'pastel-romantic', '#F4C2C2', 'https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?q=80&w=600&auto=format&fit=crop')
ON CONFLICT (layout_key) DO UPDATE 
SET name = EXCLUDED.name, category = EXCLUDED.category, default_theme_color = EXCLUDED.default_theme_color, thumbnail_url = EXCLUDED.thumbnail_url;

-- 4. Update data existing invitations jika ada, set ke template pertama
UPDATE public.invitations 
SET template_id = (SELECT id FROM public.invitation_templates WHERE layout_key = 'elegant-floral' LIMIT 1)
WHERE template_id IS NULL;
