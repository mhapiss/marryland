// src/hooks/useGallerySelections.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error';

interface UseGallerySelectionsOptions {
  galleryId: string;
  initialSelections: string[];
  maxSelectable: number;
  onLimitReached?: () => void;
}

export function useGallerySelections({
  galleryId,
  initialSelections,
  maxSelectable,
  onLimitReached,
}: UseGallerySelectionsOptions) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelections);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSyncRef = useRef<string[] | null>(null);
  const isSyncingRef = useRef(false);

  // Local storage key for offline cache & persistence
  const storageKey = `marryland_selections_${galleryId}`;

  // Initialize from props or local storage
  useEffect(() => {
    if (initialSelections.length > 0) {
      setSelectedIds(initialSelections);
      try {
        localStorage.setItem(storageKey, JSON.stringify(initialSelections));
      } catch (_) {}
    } else {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedIds(parsed);
          }
        }
      } catch (_) {}
    }
  }, [galleryId, initialSelections, storageKey]);

  // Actual database synchronization with exponential backoff
  const syncToDatabase = useCallback(
    async (nextSelections: string[], retryCount = 0): Promise<boolean> => {
      if (!galleryId) return true;

      if (!navigator.onLine) {
        setSyncStatus('offline');
        pendingSyncRef.current = nextSelections;
        return false;
      }

      setSyncStatus('saving');
      isSyncingRef.current = true;

      try {
        // Fetch currently stored photo selections in database
        const { data: dbCurrent, error: fetchErr } = await supabase
          .from('photo_selections')
          .select('gallery_photo_id')
          .eq('gallery_id', galleryId);

        if (fetchErr) throw fetchErr;

        const dbIds = new Set((dbCurrent || []).map((r) => r.gallery_photo_id));
        const currentTargetSet = new Set(nextSelections);

        // IDs to delete
        const toDelete = Array.from(dbIds).filter((id) => !currentTargetSet.has(id));
        // IDs to insert
        const toInsert = nextSelections.filter((id) => !dbIds.has(id));

        if (toDelete.length > 0) {
          const { error: delErr } = await supabase
            .from('photo_selections')
            .delete()
            .eq('gallery_id', galleryId)
            .in('gallery_photo_id', toDelete);
          if (delErr) throw delErr;
        }

        if (toInsert.length > 0) {
          const insertRows = toInsert.map((photoId) => ({
            gallery_id: galleryId,
            gallery_photo_id: photoId,
            selection_order: nextSelections.indexOf(photoId) + 1,
          }));

          const { error: insErr } = await supabase.from('photo_selections').insert(insertRows);
          if (insErr) throw insErr;
        }

        // Update selected_count in galleries
        await supabase
          .from('galleries')
          .update({ selected_count: nextSelections.length })
          .eq('id', galleryId);

        setSyncStatus('saved');
        pendingSyncRef.current = null;
        isSyncingRef.current = false;
        return true;
      } catch (err: any) {
        console.error('Database selection sync error:', err);

        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 500; // 500ms, 1000ms, 2000ms
          await new Promise((resolve) => setTimeout(resolve, delay));
          return syncToDatabase(nextSelections, retryCount + 1);
        }

        setSyncStatus('error');
        isSyncingRef.current = false;
        return false;
      }
    },
    [galleryId]
  );

  // Debounced trigger
  const scheduleSync = useCallback(
    (nextSelections: string[]) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      setSyncStatus('saving');
      pendingSyncRef.current = nextSelections;

      syncTimeoutRef.current = setTimeout(() => {
        syncToDatabase(nextSelections);
      }, 400); // 400ms debounce
    },
    [syncToDatabase]
  );

  // Online / offline event listeners to auto-flush
  useEffect(() => {
    const handleOnline = () => {
      if (pendingSyncRef.current) {
        syncToDatabase(pendingSyncRef.current);
      } else {
        setSyncStatus('saved');
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [syncToDatabase]);

  // Toggle selection
  const toggleSelection = useCallback(
    (photoId: string, e?: React.SyntheticEvent): boolean => {
      if (e && 'stopPropagation' in e) e.stopPropagation();

      const isCurrentlySelected = selectedIds.includes(photoId);

      if (!isCurrentlySelected && selectedIds.length >= maxSelectable) {
        if (onLimitReached) onLimitReached();
        toast.warning(TOAST.limitReached(maxSelectable));
        return false;
      }

      const nextSelections = isCurrentlySelected
        ? selectedIds.filter((id) => id !== photoId)
        : [...selectedIds, photoId];

      // Optimistic update
      setSelectedIds(nextSelections);

      // Save to localStorage immediately
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextSelections));
      } catch (_) {}

      // Trigger debounced sync to Supabase
      scheduleSync(nextSelections);

      return true;
    },
    [maxSelectable, onLimitReached, scheduleSync, selectedIds, storageKey]
  );

  const removeSelection = useCallback(
    (photoId: string) => {
      const nextSelections = selectedIds.filter((id) => id !== photoId);
      setSelectedIds(nextSelections);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextSelections));
      } catch (_) {}
      scheduleSync(nextSelections);
    },
    [scheduleSync, selectedIds, storageKey]
  );

  const isPhotoSelected = useCallback(
    (photoId: string) => selectedIds.includes(photoId),
    [selectedIds]
  );

  const getSelectionOrder = useCallback(
    (photoId: string): number | null => {
      const idx = selectedIds.indexOf(photoId);
      return idx !== -1 ? idx + 1 : null;
    },
    [selectedIds]
  );

  return {
    selectedIds,
    syncStatus,
    toggleSelection,
    removeSelection,
    isPhotoSelected,
    getSelectionOrder,
    totalSelected: selectedIds.length,
    remainingQuota: Math.max(0, maxSelectable - selectedIds.length),
  };
}
