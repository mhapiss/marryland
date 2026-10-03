-- supabase/seed.sql
-- Seed data untuk environment development lokal.

-- Catatan: Secara praktik terbaik, pembuatan user untuk Supabase Auth dilakukan melalui 
-- UI/endpoint Auth. Namun untuk kebutuhan seed development lokal, kita membuat dummy user.
-- Ekstensi pgcrypto diperlukan untuk fungsi crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Buat Dummy User Fotografer
-- Email: admin@marryland.com
-- Password: password123
DO $$
DECLARE
  dummy_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dummy_user_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', 
      dummy_user_id, 
      'authenticated', 
      'authenticated', 
      'admin@marryland.com', 
      crypt('password123', gen_salt('bf')), 
      now(), 
      '{"provider": "email", "providers": ["email"]}', 
      '{"full_name": "Studio Marryland"}', 
      now(), 
      now()
    );

    -- Catatan: Trigger `on_auth_user_created` dari migrasi akan otomatis memasukkan
    -- row ke tabel `profiles` dengan role 'photographer'.
    -- Kita update role-nya menjadi 'admin' untuk kemudahan pengujian fitur admin.
    UPDATE public.profiles SET role = 'admin' WHERE id = dummy_user_id;
  END IF;
END $$;


-- 2. Buat Dummy Gallery
DO $$
DECLARE
  dummy_user_id UUID := '11111111-1111-1111-1111-111111111111';
  dummy_gallery_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.galleries WHERE id = dummy_gallery_id) THEN
    INSERT INTO public.galleries (
      id, user_id, client_name, client_slug, gdrive_folder_url, gdrive_folder_id, 
      event_date, max_photos_selectable, highlight_description, client_email, 
      client_whatsapp, status, selected_count
    ) VALUES (
      dummy_gallery_id,
      dummy_user_id,
      'Rangga & Cinta',
      'rangga-cinta',
      '[LINK_FOLDER_DRIVE_UJI]',
      'folder_id_dummy_123',
      '2026-12-10',
      10, -- Batas pilihan 10 sesuai permintaan
      'Pernikahan yang hangat di Bandung',
      'klien@example.com',
      '6281234567890',
      'active',
      0
    );
  END IF;
END $$;


-- 3. Buat Data Dummy Portfolio
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.portfolio_photos LIMIT 1) THEN
    INSERT INTO public.portfolio_photos (
      image_url, storage_path, caption, category, order_index, is_published
    ) VALUES 
    ('https://images.unsplash.com/photo-1511285560929-80b456fea0bc', 'dummy/1.jpg', 'Pernikahan Adat Jawa', 'pernikahan', 1, true),
    ('https://images.unsplash.com/photo-1523438885200-e635ba2c371e', 'dummy/2.jpg', 'Momen Keluarga Hangat', 'keluarga', 2, true);
  END IF;
END $$;
