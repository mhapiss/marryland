// src/hooks/useContent.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  SiteSettingsData,
  DEFAULT_SITE_SETTINGS,
  getDefaultPageContent,
} from '../content/schema';

const CACHE_KEY_PREFIX = 'by_marryland_content_';
const SETTINGS_CACHE_KEY = 'by_marryland_site_settings';
const VERSION_CACHE_KEY = 'by_marryland_content_version';

// In-memory cache to prevent duplicate requests in the same session
const memoryCache: Record<string, { data: any; timestamp: number }> = {};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettingsData>(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }
    return DEFAULT_SITE_SETTINGS;
  });

  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('data, version')
        .eq('id', 1)
        .single();

      if (!error && data?.data) {
        const merged: SiteSettingsData = { ...DEFAULT_SITE_SETTINGS, ...data.data };
        setSettings(merged);
        try {
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
    } catch {
      // fallback to default
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refetch: fetchSettings };
}

export function usePageContent<T = Record<string, any>>(pageKey: string) {
  const defaultContent = useRef(getDefaultPageContent(pageKey)).current;

  const [content, setContent] = useState<T>(() => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${pageKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Deep merge with default schema to guarantee no missing fields
        return mergeDeep(defaultContent, parsed) as T;
      }
    } catch {
      // fallback
    }
    return defaultContent as T;
  });

  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(1);

  const fetchPageContent = useCallback(async () => {
    try {
      // Check server version first
      const { data: pageRow, error } = await supabase
        .from('page_content')
        .select('content, version')
        .eq('page_key', pageKey)
        .single();

      if (!error && pageRow?.content) {
        const merged = mergeDeep(defaultContent, pageRow.content) as T;
        setContent(merged);
        setVersion(pageRow.version || 1);
        try {
          localStorage.setItem(`${CACHE_KEY_PREFIX}${pageKey}`, JSON.stringify(merged));
        } catch {
          // ignore
        }
      } else {
        // Fallback to existing or default
        setContent((prev) => (Object.keys(prev || {}).length > 0 ? prev : (defaultContent as T)));
      }
    } catch {
      setContent((prev) => (Object.keys(prev || {}).length > 0 ? prev : (defaultContent as T)));
    }
  }, [pageKey, defaultContent]);

  useEffect(() => {
    fetchPageContent();
  }, [fetchPageContent]);

  return { content, version, loading, refetch: fetchPageContent };
}

// Deep merge helper
function mergeDeep(target: any, source: any) {
  if (!source) return target;
  if (typeof target !== 'object' || typeof source !== 'object') return source;

  const output = { ...target };
  Object.keys(source).forEach((key) => {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target
    ) {
      output[key] = mergeDeep(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  });
  return output;
}
