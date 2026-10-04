-- Migration: Indeks Performa untuk Filter Query (slug, collection_id, gallery_id, status)
-- CATATAN: File ini HANYA ditulis untuk persiapan deployment dan TIDAK dijalankan langsung.

-- 1. portfolio_collections: mempercepat pencarian berdasarkan status & urutan posisi, serta pencarian slug
CREATE INDEX IF NOT EXISTS idx_portfolio_collections_status_position 
  ON portfolio_collections(status, position);

CREATE INDEX IF NOT EXISTS idx_portfolio_collections_slug 
  ON portfolio_collections(slug);

-- 2. portfolio_photos: mempercepat query foto per koleksi yang berstatus published dengan pengurutan order_index
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_collection_published_order 
  ON portfolio_photos(collection_id, is_published, order_index);

CREATE INDEX IF NOT EXISTS idx_portfolio_photos_published_order 
  ON portfolio_photos(is_published, order_index);

-- 3. galleries: mempercepat filter galeri fotografer (user_id) dan status (active / completed)
CREATE INDEX IF NOT EXISTS idx_galleries_user_id 
  ON galleries(user_id);

CREATE INDEX IF NOT EXISTS idx_galleries_status 
  ON galleries(status);

-- 4. photo_selections: mempercepat pembacaan pilihan foto per galeri berdasarkan urutan seleksi
CREATE INDEX IF NOT EXISTS idx_photo_selections_gallery_order 
  ON photo_selections(gallery_id, selection_order);

-- 5. event_types: mempercepat pembacaan kategori jenis acara berdasarkan urutan posisi
CREATE INDEX IF NOT EXISTS idx_event_types_position 
  ON event_types(position);

-- 6. site_content & page_content: mempercepat lookup per seksi / page_key
CREATE INDEX IF NOT EXISTS idx_site_content_section 
  ON site_content(section);

CREATE INDEX IF NOT EXISTS idx_page_content_page_key 
  ON page_content(page_key);

-- 7. home_photos: mempercepat filter foto beranda berdasarkan slot dan posisi
CREATE INDEX IF NOT EXISTS idx_home_photos_slot_position 
  ON home_photos(slot, position);
