-- ============================================================
-- Migration: Fitur Undangan Digital
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Table: invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES galleries(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  groom_name TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  akad_time TEXT,
  akad_location TEXT,
  akad_maps_url TEXT,
  resepsi_time TEXT,
  resepsi_location TEXT,
  resepsi_maps_url TEXT,
  couple_story TEXT,
  cover_photo_url TEXT,
  live_streaming_url TEXT,
  background_music_url TEXT,
  theme_color TEXT DEFAULT '#6B8F71',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table: invitation_photos
CREATE TABLE IF NOT EXISTS invitation_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: rsvp_responses
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_slug TEXT,
  attendance TEXT CHECK (attendance IN ('hadir', 'tidak_hadir', 'ragu')) NOT NULL,
  jumlah_tamu INT DEFAULT 1,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table: guestbook_messages
CREATE TABLE IF NOT EXISTS guestbook_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table: digital_gifts
CREATE TABLE IF NOT EXISTS digital_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  amount NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Table: invitation_views
CREATE TABLE IF NOT EXISTS invitation_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_slug TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_views ENABLE ROW LEVEL SECURITY;

-- Invitations
-- Public can read published invitations
CREATE POLICY "Public can view published invitations" ON invitations
  FOR SELECT USING (is_published = true);

-- Owners can do CRUD on their own invitations
CREATE POLICY "Users can manage own invitations" ON invitations
  FOR ALL USING (auth.uid() = user_id);

-- Invitation Photos
-- Public can read photos of published invitations
CREATE POLICY "Public can view invitation photos" ON invitation_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invitations WHERE id = invitation_photos.invitation_id AND is_published = true)
  );

-- Owners can manage photos
CREATE POLICY "Users can manage own invitation photos" ON invitation_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM invitations WHERE id = invitation_photos.invitation_id AND user_id = auth.uid())
  );

-- RSVP Responses
-- Public can INSERT RSVP (for now, no strict checking to allow guests to submit)
CREATE POLICY "Public can insert RSVP" ON rsvp_responses
  FOR INSERT WITH CHECK (true);

-- Owners can read their RSVPs
CREATE POLICY "Users can read own RSVPs" ON rsvp_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invitations WHERE id = rsvp_responses.invitation_id AND user_id = auth.uid())
  );

-- Guestbook Messages
-- Public can read and insert guestbook messages
CREATE POLICY "Public can read guestbook" ON guestbook_messages
  FOR SELECT USING (true);

CREATE POLICY "Public can insert guestbook" ON guestbook_messages
  FOR INSERT WITH CHECK (true);

-- Owners can manage guestbook (e.g. delete bad words)
CREATE POLICY "Users can manage own guestbook" ON guestbook_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM invitations WHERE id = guestbook_messages.invitation_id AND user_id = auth.uid())
  );

-- Digital Gifts
-- Public can insert digital gifts (reporting a transfer)
CREATE POLICY "Public can insert digital gifts" ON digital_gifts
  FOR INSERT WITH CHECK (true);

-- Owners can read their digital gifts
CREATE POLICY "Users can read own digital gifts" ON digital_gifts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invitations WHERE id = digital_gifts.invitation_id AND user_id = auth.uid())
  );

-- Invitation Views
-- Public can insert views
CREATE POLICY "Public can insert views" ON invitation_views
  FOR INSERT WITH CHECK (true);

-- Owners can read views
CREATE POLICY "Users can read own views" ON invitation_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invitations WHERE id = invitation_views.invitation_id AND user_id = auth.uid())
  );
