-- ============================================================
-- Migration: Admin Role & Portfolio Management
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel profiles (sumber kebenaran role)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'photographer')) DEFAULT 'photographer',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'photographer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Backfill existing users who don't have profiles yet
INSERT INTO profiles (id, full_name, role)
SELECT id, raw_user_meta_data->>'full_name', 'photographer'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Tabel portfolio_photos
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  category TEXT CHECK (category IN ('pernikahan','wisuda','keluarga')) DEFAULT 'pernikahan',
  order_index INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

-- Helper function: bypass RLS to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Admin policies on galleries (tambahan, tidak mengganggu policy lama)
CREATE POLICY "Admin bisa melihat semua galeri" ON galleries
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin bisa melihat semua foto galeri" ON gallery_photos
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin bisa melihat semua seleksi" ON photo_selections
  FOR SELECT USING (is_admin());

-- Portfolio policies
CREATE POLICY "Public can read published portfolio" ON portfolio_photos
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admin can insert portfolio" ON portfolio_photos
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update portfolio" ON portfolio_photos
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete portfolio" ON portfolio_photos
  FOR DELETE USING (is_admin());

-- 6. Supabase Storage bucket for portfolio (run via dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);
-- NOTE: Buat bucket "portfolio" secara manual di Supabase Dashboard > Storage, set ke Public.

-- ============================================================
-- PENTING: Setelah migration ini selesai, set admin pertama:
-- UPDATE profiles SET role = 'admin' WHERE id = '<USER_UUID_ANDA>';
-- ============================================================
