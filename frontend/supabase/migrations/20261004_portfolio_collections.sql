-- Migration: Editorial Portfolio Collections per Adat / Budaya & Event Types (2026-10-04)
-- DO NOT RUN DIRECTLY. Review only.

-- 1. Table: portfolio_collections
CREATE TABLE IF NOT EXISTS portfolio_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (char_length(slug) <= 100),
  name text NOT NULL CHECK (char_length(name) <= 150),
  short_description text CHECK (char_length(short_description) <= 500),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  theme_palette text NOT NULL DEFAULT 'hijau-botol' CHECK (theme_palette IN ('hijau-botol', 'marun', 'arang', 'biru-malam', 'kunyit')),
  theme_font text NOT NULL DEFAULT 'default' CHECK (theme_font IN ('default', 'editorial', 'classic')),
  layout jsonb NOT NULL DEFAULT '{
    "hero_side": "left",
    "collage_variant": "A",
    "event_cards_staggered": true
  }'::jsonb,
  content jsonb NOT NULL DEFAULT '{
    "hero_eyebrow": "Koleksi Dokumentasi",
    "hero_heading": "[JUDUL_KOLEKSI_SERIF]",
    "hero_subheading": "[CERITA_SINGKAT_KOLEKSI]",
    "about_eyebrow": "Tentang Koleksi",
    "about_heading": "Kehangatan Tradisi dalam Bingkai Editorial",
    "about_description": "[CERITA_LENGKAP_TRADISI_DAN_MOMEN]",
    "highlight_eyebrow": "Momen Sorotan",
    "highlight_heading": "Detail dan Emosi yang Terpatri",
    "cta_heading": "Rencanakan Dokumentasi Hari Bahagiamu",
    "cta_subheading": "Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.",
    "wa_message_template": "Halo by.marryland, saya tertarik dengan dokumentasi [NAMA_KOLEKSI]. Boleh info jadwal dan paket yang tersedia?"
  }'::jsonb,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- 2. Table: event_types (Jenis Acara: Lamaran, Akad, Resepsi, Wisuda, dll)
CREATE TABLE IF NOT EXISTS event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (char_length(slug) <= 100),
  name text NOT NULL CHECK (char_length(name) <= 100),
  description text CHECK (char_length(description) <= 300),
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed standard event types if not existing
INSERT INTO event_types (slug, name, description, position)
VALUES 
  ('lamaran', 'Lamaran', 'Momen pertemuan dua keluarga dan sematan ikatan pertunangan.', 1),
  ('akad', 'Akad Nikah', 'Janji suci dan ijab kabul penuh khidmat di hadapan saksi.', 2),
  ('pemberkatan', 'Pemberkatan', 'Upacara sakral dan doa restu di hadapan keluarga terdekat.', 3),
  ('resepsi', 'Resepsi', 'Perayaan kebahagiaan bersama sanak saudara dan handai tolan.', 4),
  ('siraman', 'Siraman / Adat', 'Prosesi ritual adat pembersihan diri sebelum hari bahagia.', 5),
  ('wisuda', 'Wisuda', 'Perayaan kelulusan dan dedikasi membanggakan bagi keluarga.', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. Enhance portfolio_photos table (reuse existing table, add editorial fields)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_photos') THEN
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES portfolio_collections(id) ON DELETE SET NULL;
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS event_type_id uuid REFERENCES event_types(id) ON DELETE SET NULL;
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS slot text DEFAULT 'gallery' CHECK (slot IN ('hero', 'about_1', 'about_2', 'about_3', 'highlight', 'gallery', 'event_cover'));
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS alt text CHECK (char_length(alt) <= 250);
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS focal text DEFAULT 'center' CHECK (focal IN (
      'top left', 'top center', 'top right',
      'center left', 'center', 'center right',
      'bottom left', 'bottom center', 'bottom right'
    ));
    ALTER TABLE portfolio_photos ADD COLUMN IF NOT EXISTS blur_data text;
  ELSE
    CREATE TABLE portfolio_photos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      image_url text NOT NULL,
      storage_path text NOT NULL,
      caption text,
      category text NOT NULL DEFAULT 'wedding',
      collection_id uuid REFERENCES portfolio_collections(id) ON DELETE SET NULL,
      event_type_id uuid REFERENCES event_types(id) ON DELETE SET NULL,
      slot text NOT NULL DEFAULT 'gallery' CHECK (slot IN ('hero', 'about_1', 'about_2', 'about_3', 'highlight', 'gallery', 'event_cover')),
      order_index int DEFAULT 0,
      is_published boolean DEFAULT true,
      width int,
      height int,
      alt text CHECK (char_length(alt) <= 250),
      focal text DEFAULT 'center' CHECK (focal IN (
        'top left', 'top center', 'top right',
        'center left', 'center', 'center right',
        'bottom left', 'bottom center', 'bottom right'
      )),
      blur_data text,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- 4. Seed initial default neutral collections (Tanpa klaim kultural karangan)
INSERT INTO portfolio_collections (slug, name, short_description, status, theme_palette, theme_font, position, content)
VALUES
  (
    'melayu',
    'Melayu',
    'Rangkaian dokumentasi pernikahan dan perhelatan bernuansa Melayu yang terekam secara elegan.',
    'published',
    'hijau-botol',
    'editorial',
    1,
    '{
      "hero_eyebrow": "Koleksi Dokumentasi",
      "hero_heading": "Dokumentasi Pernikahan Adat Melayu",
      "hero_subheading": "Tangkapan visual otentik yang mengabadikan setiap tata rias, busana, dan jalinan kasih keluarga.",
      "about_eyebrow": "Tentang Koleksi",
      "about_heading": "Kemegahan Halus dalam Sentuhan Tenun & Adat",
      "about_description": "[CERITA_SINGKAT_KOLEKSI]",
      "highlight_eyebrow": "Momen Sorotan",
      "highlight_heading": "Detail Ornamen dan Emosi Murni",
      "cta_heading": "Rencanakan Dokumentasi Hari Bahagiamu",
      "cta_subheading": "Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.",
      "wa_message_template": "Halo by.marryland, saya tertarik dengan dokumentasi adat Melayu. Boleh info jadwal dan paket yang tersedia?"
    }'::jsonb
  ),
  (
    'batak',
    'Batak',
    'Dokumentasi prosesi adat Batak yang penuh wibawa, kehangatan ulos, dan sukacita keluarga.',
    'published',
    'marun',
    'default',
    2,
    '{
      "hero_eyebrow": "Koleksi Dokumentasi",
      "hero_heading": "Dokumentasi Pernikahan Adat Batak",
      "hero_subheading": "Mengabadikan energi sakral mangulosi, tatap bangga orang tua, serta tawa riang sanak keluarga.",
      "about_eyebrow": "Tentang Koleksi",
      "about_heading": "Kehangatan Ulos & Sukacita Persaudaraan",
      "about_description": "[CERITA_SINGKAT_KOLEKSI]",
      "highlight_eyebrow": "Momen Sorotan",
      "highlight_heading": "Ketegasan Wajah dan Gelak Tawa Keluarga",
      "cta_heading": "Rencanakan Dokumentasi Hari Bahagiamu",
      "cta_subheading": "Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.",
      "wa_message_template": "Halo by.marryland, saya tertarik dengan dokumentasi adat Batak. Boleh info jadwal dan paket yang tersedia?"
    }'::jsonb
  ),
  (
    'minang',
    'Minang',
    'Keanggunan busana suntiang dan baralek gadang dalam bingkai visual sinematik nan abadi.',
    'published',
    'kunyit',
    'editorial',
    3,
    '{
      "hero_eyebrow": "Koleksi Dokumentasi",
      "hero_heading": "Dokumentasi Pernikahan Adat Minang",
      "hero_subheading": "Semarak baralek gadang dengan kilau suntiang megah dan doa restu para bundo kanduang.",
      "about_eyebrow": "Tentang Koleksi",
      "about_heading": "Kemilau Emas Suntiang & Semarak Baralek",
      "about_description": "[CERITA_SINGKAT_KOLEKSI]",
      "highlight_eyebrow": "Momen Sorotan",
      "highlight_heading": "Dua Insan dalam Kemegahan Tradisi Luhur",
      "cta_heading": "Rencanakan Dokumentasi Hari Bahagiamu",
      "cta_subheading": "Konsultasikan jadwal liputan dan konsep dokumentasi bersama tim kami.",
      "wa_message_template": "Halo by.marryland, saya tertarik dengan dokumentasi adat Minang. Boleh info jadwal dan paket yang tersedia?"
    }'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE portfolio_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: portfolio_collections
DROP POLICY IF EXISTS "Public can view published collections" ON portfolio_collections;
CREATE POLICY "Public can view published collections" 
  ON portfolio_collections FOR SELECT 
  USING (status = 'published' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can insert collections" ON portfolio_collections;
CREATE POLICY "Admin can insert collections" 
  ON portfolio_collections FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update collections" ON portfolio_collections;
CREATE POLICY "Admin can update collections" 
  ON portfolio_collections FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete collections" ON portfolio_collections;
CREATE POLICY "Admin can delete collections" 
  ON portfolio_collections FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. RLS Policies: event_types
DROP POLICY IF EXISTS "Public can view event types" ON event_types;
CREATE POLICY "Public can view event types" 
  ON event_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert event types" ON event_types;
CREATE POLICY "Admin can insert event types" 
  ON event_types FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update event types" ON event_types;
CREATE POLICY "Admin can update event types" 
  ON event_types FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete event types" ON event_types;
CREATE POLICY "Admin can delete event types" 
  ON event_types FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 8. Verify / Test Queries (Commented out):
-- SELECT * FROM portfolio_collections WHERE status = 'published';
-- SELECT * FROM event_types ORDER BY position ASC;
-- SELECT id, caption, collection_id, event_type_id, slot FROM portfolio_photos LIMIT 10;
