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

export function usePortfolioCollections() {
  const [collections, setCollections] = useState<PortfolioCollection[]>(DEFAULT_COLLECTIONS);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_collections')
        .select('*')
        .eq('status', 'published')
        .order('position', { ascending: true });

      if (!error && data && data.length > 0) {
        setCollections(data);
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
