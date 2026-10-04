-- Migration: Unified Content Hub, Media Library, and Site-wide Synchronization (2026-10-04)
-- DO NOT RUN DIRECTLY. Review and reference only.

-- 1. Table: media_assets (Immutable Media Library)
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_path text NOT NULL CHECK (char_length(base_path) <= 500),
  widths int[] NOT NULL DEFAULT '{480, 960, 1600}',
  width int NOT NULL,
  height int NOT NULL,
  blur_data text,
  default_alt text CHECK (char_length(default_alt) <= 250),
  default_focal text DEFAULT 'center' CHECK (default_focal IN (
    'top left', 'top center', 'top right',
    'center left', 'center', 'center right',
    'bottom left', 'bottom center', 'bottom right'
  )),
  size_bytes int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- 2. Table: site_meta (Global Versioning for Client Cache Invalidation)
CREATE TABLE IF NOT EXISTS site_meta (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content_version int NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

-- Seed singleton site_meta if empty
INSERT INTO site_meta (id, content_version)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Table: site_settings (Global Settings Singleton)
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL DEFAULT '{
    "brand_name": "by.marryland",
    "tagline": "Dokumentasi visual pernikahan & perhelatan adat berstandar editorial.",
    "whatsapp_number": "6281234567890",
    "email": "halo@marryland.id",
    "instagram": "by.marryland",
    "default_wa_template": "Halo by.marryland, saya ingin konsultasi mengenai dokumentasi hari bahagia kami.",
    "seo_default_title": "by.marryland | Studio Dokumentasi Pernikahan & Adat",
    "seo_default_description": "Seleksi foto klien cepat, kurasi visual berstandar editorial tinggi, dan penghormatan tulus pada prosesi adat.",
    "footer_statement": "Studio kurasi dokumentasi pernikahan dan perhelatan keluarga dengan pendekatan editorial dan penghormatan tulus pada tradisi.",
    "default_palette": "hijau-botol",
    "default_font": "editorial",
    "nav_items": [
      { "label": "Untuk Fotografer", "href": "/" },
      { "label": "Untuk Klien", "href": "/untuk-klien" },
      { "label": "Portofolio", "href": "/portofolio" },
      { "label": "Demo", "href": "/demo" },
      { "label": "FAQ", "href": "/faq" },
      { "label": "Kontak", "href": "/kontak" }
    ]
  }'::jsonb,
  version int NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

INSERT INTO site_settings (id, version)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- 4. Table: page_content (Single Source of Truth per Page)
CREATE TABLE IF NOT EXISTS page_content (
  page_key text PRIMARY KEY CHECK (page_key IN (
    'home', 'client', 'demo', 'faq', 'contact', 'portfolio_index', 'terms', 'privacy'
  )),
  content jsonb NOT NULL,
  version int NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- 5. Table: content_revisions (Audit Trail / Max 20 revisions per page)
CREATE TABLE IF NOT EXISTS content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  content jsonb NOT NULL,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_revisions_page_key_created ON content_revisions(page_key, created_at DESC);

-- Trigger Function: prune old revisions keeping only last 20
CREATE OR REPLACE FUNCTION prune_content_revisions()
RETURNS trigger AS $$
BEGIN
  DELETE FROM content_revisions
  WHERE id IN (
    SELECT id FROM content_revisions
    WHERE page_key = NEW.page_key
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prune_revisions ON content_revisions;
CREATE TRIGGER trigger_prune_revisions
  AFTER INSERT ON content_revisions
  FOR EACH ROW
  EXECUTE FUNCTION prune_content_revisions();

-- Trigger Function: bump site_meta.content_version on any publish/update
CREATE OR REPLACE FUNCTION bump_site_content_version()
RETURNS trigger AS $$
BEGIN
  UPDATE site_meta
  SET content_version = content_version + 1, updated_at = now()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bump_version_page ON page_content;
CREATE TRIGGER trigger_bump_version_page
  AFTER UPDATE OR INSERT ON page_content
  FOR EACH ROW
  EXECUTE FUNCTION bump_site_content_version();

DROP TRIGGER IF EXISTS trigger_bump_version_settings ON site_settings;
CREATE TRIGGER trigger_bump_version_settings
  AFTER UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION bump_site_content_version();

-- 6. Link portfolio_collections & portfolio_photos to media_assets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_collections') THEN
    ALTER TABLE portfolio_collections ADD COLUMN IF NOT EXISTS media_cover_id uuid REFERENCES media_assets(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_photos') THEN
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;

-- 7A. media_assets RLS
DROP POLICY IF EXISTS "Public can view media assets" ON media_assets;
CREATE POLICY "Public can view media assets"
  ON media_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert media assets" ON media_assets;
CREATE POLICY "Admin can insert media assets"
  ON media_assets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update media assets" ON media_assets;
CREATE POLICY "Admin can update media assets"
  ON media_assets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete media assets" ON media_assets;
CREATE POLICY "Admin can delete media assets"
  ON media_assets FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7B. site_meta RLS
DROP POLICY IF EXISTS "Public can view site meta" ON site_meta;
CREATE POLICY "Public can view site meta"
  ON site_meta FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can update site meta" ON site_meta;
CREATE POLICY "Admin can update site meta"
  ON site_meta FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7C. site_settings RLS
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage site settings" ON site_settings;
CREATE POLICY "Admin can manage site settings"
  ON site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7D. page_content RLS
DROP POLICY IF EXISTS "Public can view page content" ON page_content;
CREATE POLICY "Public can view page content"
  ON page_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage page content" ON page_content;
CREATE POLICY "Admin can manage page content"
  ON page_content FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7E. content_revisions RLS (Admin Only)
DROP POLICY IF EXISTS "Admin can view revisions" ON content_revisions;
CREATE POLICY "Admin can view revisions"
  ON content_revisions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can insert revisions" ON content_revisions;
CREATE POLICY "Admin can insert revisions"
  ON content_revisions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete revisions" ON content_revisions;
CREATE POLICY "Admin can delete revisions"
  ON content_revisions FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 8. Storage bucket: media-library
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media-library', 'media-library', true, 15728640, '{image/webp,image/jpeg,image/png}')
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view media-library" ON storage.objects;
CREATE POLICY "Public can view media-library"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-library');

DROP POLICY IF EXISTS "Admin can insert media-library" ON storage.objects;
CREATE POLICY "Admin can insert media-library"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media-library' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update media-library" ON storage.objects;
CREATE POLICY "Admin can update media-library"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media-library' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete media-library" ON storage.objects;
CREATE POLICY "Admin can delete media-library"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media-library' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 9. Idempotent Data Migration Script (From home_photos & portfolio_photos into media_assets)
-- NOTE: Old tables (home_photos, portfolio_photos) are PRESERVED safely.
DO $$
BEGIN
  -- 9A. Migrate home_photos to media_assets if not already migrated
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'home_photos') THEN
    INSERT INTO media_assets (base_path, width, height, default_alt, default_focal, blur_data, created_at)
    SELECT 
      hp.path, 
      COALESCE(hp.width, 1200), 
      COALESCE(hp.height, 800), 
      hp.alt, 
      COALESCE(hp.focal, 'center'), 
      hp.blur_data, 
      hp.created_at
    FROM home_photos hp
    WHERE NOT EXISTS (
      SELECT 1 FROM media_assets ma WHERE ma.base_path = hp.path
    );
  END IF;

  -- 9B. Migrate portfolio_photos to media_assets if not already migrated
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_photos') THEN
    INSERT INTO media_assets (base_path, width, height, default_alt, default_focal, blur_data, created_at)
    SELECT 
      COALESCE(pp.storage_path, pp.image_url), 
      COALESCE(pp.width, 1200), 
      COALESCE(pp.height, 800), 
      COALESCE(pp.alt, pp.caption), 
      COALESCE(pp.focal, 'center'), 
      pp.blur_data, 
      pp.created_at
    FROM portfolio_photos pp
    WHERE NOT EXISTS (
      SELECT 1 FROM media_assets ma WHERE ma.base_path = COALESCE(pp.storage_path, pp.image_url)
    );

    -- Link media_id back to portfolio_photos
    UPDATE portfolio_photos pp
    SET media_id = ma.id
    FROM media_assets ma
    WHERE ma.base_path = COALESCE(pp.storage_path, pp.image_url)
      AND pp.media_id IS NULL;
  END IF;
END $$;

-- 10. Verification / Sanity Check Queries (Commented out):
-- SELECT count(*) AS count_media_assets FROM media_assets;
-- SELECT count(*) AS count_home_photos FROM home_photos;
-- SELECT count(*) AS count_portfolio_photos FROM portfolio_photos;
-- SELECT count(*) AS count_page_content FROM page_content;
-- SELECT * FROM site_meta WHERE id = 1;
-- SELECT * FROM site_settings WHERE id = 1;
