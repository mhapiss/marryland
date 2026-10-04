// src/hooks/usePortfolioData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  PortfolioCollection,
  EventType,
  PortfolioPhotoItem,
  DEFAULT_COLLECTIONS,
  DEFAULT_EVENT_TYPES,
  DEFAULT_COLLECTION_PHOTOS,
} from '../config/portfolioThemes';

let cachedCollections: PortfolioCollection[] | null = null;

export function usePortfolioCollections() {
  const [collections, setCollections] = useState<PortfolioCollection[]>(cachedCollections || DEFAULT_COLLECTIONS);
  const [loading, setLoading] = useState(!cachedCollections);

  const fetchCollections = useCallback(async () => {
    try {
      const [colRes, photoRes] = await Promise.all([
        supabase
          .from('portfolio_collections')
          .select('*')
          .eq('status', 'published')
          .order('position', { ascending: true }),
        supabase
          .from('portfolio_photos')
          .select('id, collection_id, image_url, slot, order_index')
          .eq('is_published', true)
          .order('order_index', { ascending: true }),
      ]);

      const data = colRes.data;
      const photos = photoRes.data;

      if (!colRes.error && data && data.length > 0) {
        const enriched = data.map((col) => {
          const colPhotos = photos ? photos.filter((p) => p.collection_id === col.id) : [];
          const heroPhoto = colPhotos.find((p) => p.slot === 'hero') || colPhotos[0];
          const resolvedCover =
            (col.content as any)?.cover_url ||
            col.cover_url ||
            heroPhoto?.image_url ||
            null;

          // Urutkan foto untuk preview kolase 3 foto:
          // Utamakan slot potret unggulan (about_1, hero, about_2, about_3, highlight, gallery)
          const slotPriority: Record<string, number> = {
            about_1: 1,
            hero: 2,
            about_2: 3,
            about_3: 4,
            highlight: 5,
            gallery: 6,
          };

          const sortedPhotos = [...colPhotos].sort((a, b) => {
            const pa = slotPriority[a.slot || ''] || 99;
            const pb = slotPriority[b.slot || ''] || 99;
            return pa - pb;
          });

          // Kumpulkan URL unik
          const uniqueUrls: string[] = [];
          for (const p of sortedPhotos) {
            if (p.image_url && !uniqueUrls.includes(p.image_url)) {
              uniqueUrls.push(p.image_url);
            }
          }

          // Fallback ke default photos jika foto dari database kurang dari 3
          const fallbackCol = DEFAULT_COLLECTIONS.find(
            (c) => c.slug === col.slug || c.id === col.id
          );
          const fallbackUrls = [
            ...(fallbackCol?.preview_photos || []),
            ...(DEFAULT_COLLECTION_PHOTOS[col.slug] || []).map((p) => p.image_url),
            resolvedCover,
          ].filter(Boolean) as string[];

          for (const fb of fallbackUrls) {
            if (uniqueUrls.length >= 3) break;
            if (!uniqueUrls.includes(fb)) {
              uniqueUrls.push(fb);
            }
          }

          const preview_photos = uniqueUrls.slice(0, 3);
          const total_photos = Math.max(colPhotos.length, fallbackCol?.total_photos || 12);

          return {
            ...col,
            cover_url: resolvedCover,
            preview_photos,
            total_photos,
          };
        });

        cachedCollections = enriched;
        setCollections(enriched);
      } else {
        setCollections(DEFAULT_COLLECTIONS);
      }
    } catch {
      setCollections(DEFAULT_COLLECTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, loading, refetch: fetchCollections };
}

export function useCollectionDetail(slug: string | undefined) {
  const [collection, setCollection] = useState<PortfolioCollection | null>(null);
  const [photos, setPhotos] = useState<PortfolioPhotoItem[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>(DEFAULT_EVENT_TYPES);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchCollectionDetail = useCallback(async () => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      // 1. Fetch collection metadata
      const { data: colData, error: colError } = await supabase
        .from('portfolio_collections')
        .select('*')
        .eq('slug', slug)
        .single();

      let activeCollection: PortfolioCollection | null = colData;

      if (colError || !colData) {
        // Check default fallback collections
        const fallbackCol = DEFAULT_COLLECTIONS.find((c) => c.slug === slug);
        if (fallbackCol) {
          activeCollection = fallbackCol;
        } else {
          setNotFound(true);
          setLoading(false);
          return;
        }
      }

      setCollection(activeCollection);

      // 2. Fetch event types
      const { data: evData } = await supabase
        .from('event_types')
        .select('*')
        .order('position', { ascending: true });

      if (evData && evData.length > 0) {
        setEventTypes(evData);
      } else {
        setEventTypes(DEFAULT_EVENT_TYPES);
      }

      // 3. Fetch photos for this collection
      if (activeCollection && activeCollection.id && !activeCollection.id.startsWith('col-')) {
        const { data: photoData, error: photoErr } = await supabase
          .from('portfolio_photos')
          .select('*')
          .eq('collection_id', activeCollection.id)
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (!photoErr && photoData && photoData.length > 0) {
          setPhotos(photoData);
        } else {
          // Fallback to sample photos for this slug
          const sample = DEFAULT_COLLECTION_PHOTOS[slug] || DEFAULT_COLLECTION_PHOTOS.melayu || [];
          setPhotos(sample);
        }
      } else {
        // Fallback to sample photos for default collections
        const sample = DEFAULT_COLLECTION_PHOTOS[slug] || DEFAULT_COLLECTION_PHOTOS.melayu || [];
        setPhotos(sample);
      }
    } catch {
      const fallbackCol = DEFAULT_COLLECTIONS.find((c) => c.slug === slug);
      if (fallbackCol) {
        setCollection(fallbackCol);
        setPhotos(DEFAULT_COLLECTION_PHOTOS[slug] || DEFAULT_COLLECTION_PHOTOS.melayu || []);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCollectionDetail();
  }, [fetchCollectionDetail]);

  return { collection, photos, eventTypes, loading, notFound, refetch: fetchCollectionDetail };
}
