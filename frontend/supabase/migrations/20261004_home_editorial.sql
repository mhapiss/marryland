-- Migration: Editorial Landing, Marquee & Portfolio Enhancements (2026-10-04)
-- DO NOT RUN DIRECTLY. Review only.

-- 1. Table: site_content
CREATE TABLE IF NOT EXISTS site_content (
  section text PRIMARY KEY CHECK (section IN (
    'meta', 'nav', 'hero', 'marquee', 'facts', 'portfolio', 
    'problem', 'benefits', 'featured', 'demo', 'steps', 
    'pricing', 'faq', 'cta', 'clientPage', 'contact', 'footer'
  )),
  content jsonb NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- 2. Table: home_photos
CREATE TABLE IF NOT EXISTS home_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text NOT NULL CHECK (slot IN (
    'hero_main', 'hero_illustration', 'marquee', 'featured', 'portfolio', 
    'steps_mockup', 'problem_chat', 'demo_mockup', 'contact', 'client_hero'
  )),
  position int DEFAULT 0,
  path text NOT NULL CHECK (char_length(path) <= 500),
  width int NOT NULL,
  height int NOT NULL,
  alt text CHECK (char_length(alt) <= 250),
  title text CHECK (char_length(title) <= 250),
  description text CHECK (char_length(description) <= 1000),
  focal text DEFAULT 'center' CHECK (focal IN (
    'top left', 'top center', 'top right',
    'center left', 'center', 'center right',
    'bottom left', 'bottom center', 'bottom right'
  )),
  blur_data text,
  created_at timestamptz DEFAULT now()
);

-- 3. Enhance portfolio_photos table (reuse existing table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_photos') THEN
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS width int;
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS height int;
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS category text DEFAULT 'wedding';
  ELSE
    CREATE TABLE portfolio_photos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      image_url text NOT NULL,
      storage_path text NOT NULL,
      caption text,
      category text NOT NULL DEFAULT 'wedding',
      order_index int DEFAULT 0,
      is_published boolean DEFAULT true,
      width int,
      height int,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- 4. Table: portfolio_categories
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 100),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) <= 100),
  description text CHECK (char_length(description) <= 300),
  cover_url text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed initial default categories if empty
INSERT INTO portfolio_categories (name, slug, description, order_index)
VALUES 
  ('Wedding', 'wedding', 'Janji suci, tangis haru, dan perayaan cinta yang abadi.', 1),
  ('Lamaran', 'lamaran', 'Langkah awal pertemuan dua keluarga dalam kehangatan.', 2),
  ('Wisuda', 'wisuda', 'Penghargaan atas dedikasi dan senyum bangga keluarga.', 3)
ON CONFLICT (slug) DO NOTHING;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: site_content
DROP POLICY IF EXISTS "Public can view site content" ON site_content;
CREATE POLICY "Public can view site content" 
  ON site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert site content" ON site_content;
CREATE POLICY "Admin can insert site content" 
  ON site_content FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update site content" ON site_content;
CREATE POLICY "Admin can update site content" 
  ON site_content FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete site content" ON site_content;
CREATE POLICY "Admin can delete site content" 
  ON site_content FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. RLS Policies: home_photos
DROP POLICY IF EXISTS "Public can view home photos" ON home_photos;
CREATE POLICY "Public can view home photos" 
  ON home_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert home photos" ON home_photos;
CREATE POLICY "Admin can insert home photos" 
  ON home_photos FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update home photos" ON home_photos;
CREATE POLICY "Admin can update home photos" 
  ON home_photos FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete home photos" ON home_photos;
CREATE POLICY "Admin can delete home photos" 
  ON home_photos FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 8. RLS Policies: portfolio_photos
DROP POLICY IF EXISTS "Public can view published portfolio" ON portfolio_photos;
CREATE POLICY "Public can view published portfolio" 
  ON portfolio_photos FOR SELECT 
  USING (is_published = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can insert portfolio" ON portfolio_photos;
CREATE POLICY "Admin can insert portfolio" 
  ON portfolio_photos FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update portfolio" ON portfolio_photos;
CREATE POLICY "Admin can update portfolio" 
  ON portfolio_photos FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete portfolio" ON portfolio_photos;
CREATE POLICY "Admin can delete portfolio" 
  ON portfolio_photos FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 9. RLS Policies: portfolio_categories
DROP POLICY IF EXISTS "Public can view portfolio categories" ON portfolio_categories;
CREATE POLICY "Public can view portfolio categories" 
  ON portfolio_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert portfolio categories" ON portfolio_categories;
CREATE POLICY "Admin can insert portfolio categories" 
  ON portfolio_categories FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update portfolio categories" ON portfolio_categories;
CREATE POLICY "Admin can update portfolio categories" 
  ON portfolio_categories FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete portfolio categories" ON portfolio_categories;
CREATE POLICY "Admin can delete portfolio categories" 
  ON portfolio_categories FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 10. Storage bucket: home-media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('home-media', 'home-media', true, 15728640, '{image/webp,image/jpeg,image/png}')
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view home-media" ON storage.objects;
CREATE POLICY "Public can view home-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'home-media');

DROP POLICY IF EXISTS "Admin can insert home-media" ON storage.objects;
CREATE POLICY "Admin can insert home-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'home-media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update home-media" ON storage.objects;
CREATE POLICY "Admin can update home-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'home-media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete home-media" ON storage.objects;
CREATE POLICY "Admin can delete home-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'home-media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Verification test query:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('site_content', 'home_photos', 'portfolio_photos', 'portfolio_categories');
