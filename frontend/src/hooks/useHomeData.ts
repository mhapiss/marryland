import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { HomePhoto } from '../components/ResponsiveImage';
import { HOME_DEFAULTS } from '../config/homeDefaults';

export interface SiteContentItem {
  id?: string;
  section: string;
  content: any;
  data: any; // Alias for content for backwards/callers compatibility
  visible: boolean;
}

export interface HomeData {
  content: Record<string, SiteContentItem>;
  photos: Record<string, HomePhoto>;
  photosArray: HomePhoto[];
}

const CACHE_KEY = 'marryland_home_data';

// Helper to create complete default map from HOME_DEFAULTS
export function getDefaultContentMap(): Record<string, SiteContentItem> {
  const map: Record<string, SiteContentItem> = {};
  Object.entries(HOME_DEFAULTS).forEach(([key, val]) => {
    map[key] = {
      section: key,
      content: val,
      data: val,
      visible: key === 'pricing' ? false : true,
    };
  });
  return map;
}

export function useHomeData() {
  const [data, setData] = useState<HomeData>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Ensure default fallback is merged
        const base = getDefaultContentMap();
        if (parsed.content) {
          Object.keys(base).forEach(key => {
            if (parsed.content[key]) {
              const val = parsed.content[key].content || parsed.content[key].data || base[key].content;
              base[key] = {
                section: key,
                content: val,
                data: val,
                visible: parsed.content[key].visible ?? base[key].visible
              };
            }
          });
        }
        return {
          content: base,
          photos: parsed.photos || {},
          photosArray: parsed.photosArray || []
        };
      }
    } catch (e) {
      // Ignore cache parse error
    }
    return {
      content: getDefaultContentMap(),
      photos: {},
      photosArray: []
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [contentRes, photosRes] = await Promise.all([
          supabase.from('site_content').select('*'),
          supabase.from('home_photos').select('*')
        ]);

        if (contentRes.error) throw contentRes.error;
        if (photosRes.error) throw photosRes.error;

        const baseMap = getDefaultContentMap();
        if (contentRes.data && contentRes.data.length > 0) {
          contentRes.data.forEach((item: any) => {
            const rawContent = item.content || item.data || {};
            const defaultVal = HOME_DEFAULTS[item.section as keyof typeof HOME_DEFAULTS] || {};
            const merged = typeof defaultVal === 'object' && !Array.isArray(defaultVal)
              ? { ...defaultVal, ...rawContent }
              : (rawContent ?? defaultVal);

            baseMap[item.section] = {
              id: item.id,
              section: item.section,
              content: merged,
              data: merged,
              visible: item.visible ?? (item.section === 'pricing' ? false : true),
            };
          });
        }

        const photosMap: Record<string, HomePhoto> = {};
        if (photosRes.data && photosRes.data.length > 0) {
          photosRes.data.forEach((photo: HomePhoto) => {
            photosMap[photo.slot] = photo;
          });
        }

        const newData: HomeData = {
          content: baseMap,
          photos: photosMap,
          photosArray: photosRes.data || []
        };

        if (mounted) {
          setData(newData);
          setLoading(false);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
          } catch (e) {
            // LocalStorage quota may be exceeded, ignore
          }
        }
      } catch (err: any) {
        if (mounted) {
          // If error (table doesn't exist, etc.), keep existing default data
          setError(err);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
