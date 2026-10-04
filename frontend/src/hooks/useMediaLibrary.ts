// src/hooks/useMediaLibrary.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MediaAsset } from '../content/schema';
import { processHomeImage } from '../lib/imageProcessor';

export function useMediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'used' | 'unused'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 48;

  // Fetch all usages across pages and collections
  const fetchUsagesMap = async (): Promise<Record<string, Array<{ page_key: string; section_id: string; slot_key: string }>>> => {
    const usages: Record<string, Array<{ page_key: string; section_id: string; slot_key: string }>> = {};

    try {
      // 1. Scan page_content
      const { data: pages } = await supabase.from('page_content').select('page_key, content');
      if (pages) {
        for (const p of pages) {
          const content = p.content || {};
          for (const secKey of Object.keys(content)) {
            const sec = content[secKey] || {};
            for (const fieldKey of Object.keys(sec)) {
              const val = sec[fieldKey];
              if (Array.isArray(val)) {
                for (const item of val) {
                  if (item?.media_id) {
                    if (!usages[item.media_id]) usages[item.media_id] = [];
                    usages[item.media_id].push({
                      page_key: p.page_key,
                      section_id: secKey,
                      slot_key: fieldKey,
                    });
                  }
                }
              }
            }
          }
        }
      }

      // 2. Scan portfolio_collections (cover)
      const { data: cols } = await supabase.from('portfolio_collections').select('id, slug, media_cover_id');
      if (cols) {
        for (const c of cols) {
          if (c.media_cover_id) {
            if (!usages[c.media_cover_id]) usages[c.media_cover_id] = [];
            usages[c.media_cover_id].push({
              page_key: `portfolio/${c.slug}`,
              section_id: 'hero',
              slot_key: 'cover',
            });
          }
        }
      }

      // 3. Scan portfolio_photos
      const { data: pPhotos } = await supabase.from('portfolio_photos').select('id, media_id, slot');
      if (pPhotos) {
        for (const pp of pPhotos) {
          if (pp.media_id) {
            if (!usages[pp.media_id]) usages[pp.media_id] = [];
            usages[pp.media_id].push({
              page_key: 'portfolio_photos',
              section_id: 'gallery',
              slot_key: pp.slot || 'gallery',
            });
          }
        }
      }
    } catch {
      // ignore
    }

    return usages;
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const usagesMap = await fetchUsagesMap();

      let query = supabase
        .from('media_assets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        query = query.ilike('default_alt', `%${searchQuery.trim()}%`);
      }

      const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (!error && data) {
        const enriched: MediaAsset[] = data.map((item) => {
          const list = usagesMap[item.id] || [];
          return {
            ...item,
            usage_count: list.length,
            usages: list,
          };
        });

        // Filter by used / unused
        const filtered = enriched.filter((a) => {
          if (filterMode === 'used') return (a.usage_count || 0) > 0;
          if (filterMode === 'unused') return (a.usage_count || 0) === 0;
          return true;
        });

        setAssets(filtered);
        setTotalCount(count || filtered.length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterMode]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Upload single photo with WebP variants
  const uploadSingleMedia = async (file: File, defaultAlt: string = ''): Promise<MediaAsset> => {
    const processed = await processHomeImage(file);
    const mediaId = crypto.randomUUID();
    const basePath = `media/${mediaId}`;

    const uploadVariant = async (blob: Blob | null, suffix: string) => {
      if (!blob) return;
      const path = `${basePath}_${suffix}.webp`;
      const { error } = await supabase.storage
        .from('home-media')
        .upload(path, blob, { cacheControl: '31536000', upsert: true });
      if (error) throw error;
    };

    // Upload 3 variants in parallel
    await Promise.all([
      uploadVariant(processed.variants.w480, '480'),
      uploadVariant(processed.variants.w960, '960'),
      uploadVariant(processed.variants.w1600, '1600'),
    ]);

    const record = {
      id: mediaId,
      base_path: basePath,
      widths: [480, 960, 1600],
      width: processed.width,
      height: processed.height,
      blur_data: processed.blurData,
      default_alt: defaultAlt || file.name.replace(/\.[^/.]+$/, ''),
      default_focal: 'center',
      size_bytes: file.size,
    };

    const { data, error } = await supabase
      .from('media_assets')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Replace file everywhere for a media asset
  const replaceMediaBlob = async (assetId: string, newFile: File): Promise<void> => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) throw new Error('Aset media tidak ditemukan');

    const processed = await processHomeImage(newFile);
    const basePath = asset.base_path;

    const uploadVariant = async (blob: Blob | null, suffix: string) => {
      if (!blob) return;
      const path = `${basePath}_${suffix}.webp`;
      const { error } = await supabase.storage
        .from('home-media')
        .upload(path, blob, { cacheControl: '31536000', upsert: true });
      if (error) throw error;
    };

    await Promise.all([
      uploadVariant(processed.variants.w480, '480'),
      uploadVariant(processed.variants.w960, '960'),
      uploadVariant(processed.variants.w1600, '1600'),
    ]);

    // Update metadata
    await supabase
      .from('media_assets')
      .update({
        width: processed.width,
        height: processed.height,
        blur_data: processed.blurData,
        size_bytes: newFile.size,
      })
      .eq('id', assetId);

    // Bump global cache version
    await supabase.rpc('bump_site_content_version').catch(() => {});

    await fetchAssets();
  };

  // Delete media asset
  const deleteMedia = async (assetId: string): Promise<void> => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    // Delete variants in storage
    const paths = [
      `${asset.base_path}_480.webp`,
      `${asset.base_path}_960.webp`,
      `${asset.base_path}_1600.webp`,
    ];
    await supabase.storage.from('home-media').remove(paths);

    const { error } = await supabase.from('media_assets').delete().eq('id', assetId);
    if (error) throw error;

    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  return {
    assets,
    loading,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    page,
    setPage,
    totalCount,
    pageSize: PAGE_SIZE,
    fetchAssets,
    uploadSingleMedia,
    replaceMediaBlob,
    deleteMedia,
  };
}
