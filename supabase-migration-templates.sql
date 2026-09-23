-- ============================================================
-- Update Migration: Tambah Template Undangan
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'sage-green';
