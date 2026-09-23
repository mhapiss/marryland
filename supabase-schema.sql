-- schema.sql
-- Silakan jalankan script ini di menu "SQL Editor" pada Supabase dashboard kamu.

-- Hapus tabel jika sudah ada (hati-hati jika ada data penting)
DROP TABLE IF EXISTS photo_selections CASCADE;
DROP TABLE IF EXISTS gallery_photos CASCADE;
DROP TABLE IF EXISTS galleries CASCADE;

-- 1. Tabel Galleries
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_slug TEXT NOT NULL,
  gdrive_folder_url TEXT NOT NULL,
  gdrive_folder_id TEXT NOT NULL,
  event_date DATE,
  max_photos_selectable INT NOT NULL DEFAULT 100,
  deadline_date DATE,
  highlight_description TEXT,
  client_email TEXT,
  client_whatsapp TEXT NOT NULL,
  allow_download BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('draft','active','completed')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  selected_count INT DEFAULT 0
);

-- 2. Tabel Gallery Photos (menyimpan metadata foto dari Drive)
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  gdrive_file_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  thumbnail_url TEXT,
  is_edited BOOLEAN DEFAULT FALSE,
  category TEXT CHECK (category IN ('edited','umum')) DEFAULT 'umum',
  order_index INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Tabel Photo Selections (menyimpan foto yang dipilih klien)
CREATE TABLE photo_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  gallery_photo_id UUID REFERENCES gallery_photos(id) ON DELETE CASCADE,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  selection_order INT
);

-- RLS (Row Level Security) Policies
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_selections ENABLE ROW LEVEL SECURITY;

-- Policies untuk Fotografer (Auth)
CREATE POLICY "Fotografer bisa melihat galerinya sendiri" ON galleries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Fotografer bisa membuat galerinya sendiri" ON galleries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Fotografer bisa update galerinya sendiri" ON galleries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Fotografer bisa hapus galerinya sendiri" ON galleries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Fotografer bisa melihat foto di galerinya" ON gallery_photos FOR SELECT USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_photos.gallery_id AND galleries.user_id = auth.uid()));
CREATE POLICY "Fotografer bisa menambah foto ke galerinya" ON gallery_photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_photos.gallery_id AND galleries.user_id = auth.uid()));
CREATE POLICY "Fotografer bisa update foto di galerinya" ON gallery_photos FOR UPDATE USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_photos.gallery_id AND galleries.user_id = auth.uid()));
CREATE POLICY "Fotografer bisa hapus foto di galerinya" ON gallery_photos FOR DELETE USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = gallery_photos.gallery_id AND galleries.user_id = auth.uid()));

CREATE POLICY "Fotografer bisa melihat seleksi foto" ON photo_selections FOR SELECT USING (EXISTS (SELECT 1 FROM galleries WHERE galleries.id = photo_selections.gallery_id AND galleries.user_id = auth.uid()));
CREATE POLICY "Users can delete their own photo selections" ON photo_selections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = photo_selections.gallery_id
            AND galleries.user_id = auth.uid()
        )
    );

-- Policies untuk Public (Klien tanpa login)
-- Klien butuh akses BACA ke galleries, gallery_photos berdasarkan gallery_id, serta INSERT/DELETE ke photo_selections
CREATE POLICY "Public bisa melihat galeri" ON galleries FOR SELECT USING (true);
CREATE POLICY "Public bisa melihat foto galeri" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Public bisa membuat pilihan foto" ON photo_selections FOR INSERT WITH CHECK (true);
CREATE POLICY "Public bisa menghapus pilihan foto" ON photo_selections FOR DELETE USING (true);
CREATE POLICY "Public bisa melihat pilihan foto" ON photo_selections FOR SELECT USING (true);
