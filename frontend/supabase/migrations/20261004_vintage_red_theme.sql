-- Migration: Vintage Red Visual Identity, Global Theme Presets & Print Frame Option (2026-10-04)
-- DO NOT RUN DIRECTLY. Review and reference only.

-- 1. Update default values in site_settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_settings') THEN
    UPDATE site_settings
    SET data = jsonb_set(
      jsonb_set(
        jsonb_set(
          data,
          '{default_palette}',
          '"merah-vintage"'
        ),
        '{default_font}',
        '"gloock"'
      ),
      '{photo_frame_style}',
      '"print"'
    ),
    version = version + 1,
    updated_at = now()
    WHERE id = 1;
  END IF;
END $$;

-- 2. Verify settings query (commented out)
-- SELECT data->>'default_palette' AS palette, data->>'default_font' AS font, data->>'photo_frame_style' AS frame_style FROM site_settings WHERE id = 1;
