import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';
type RealtimeCallback = (payload: any) => void;

interface UseRealtimeOptions {
  table: string;
  /** Optional Postgres filter string, e.g. "gallery_id=eq.abc123" */
  filter?: string;
  /** Callback fired on any matching INSERT */
  onInsert?: RealtimeCallback;
  /** Callback fired on any matching UPDATE */
  onUpdate?: RealtimeCallback;
  /** Callback fired on any matching DELETE */
  onDelete?: RealtimeCallback;
  /** Callback fired on ANY event (INSERT/UPDATE/DELETE) */
  onAny?: RealtimeCallback;
  /** Set to false to temporarily disable the subscription */
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime Postgres Changes for a given table.
 * Automatically cleans up on unmount or when dependencies change.
 *
 * Usage:
 * ```ts
 * useRealtime({
 *   table: 'galleries',
 *   filter: `user_id=eq.${user.id}`,
 *   onUpdate: (payload) => { ... },
 *   onInsert: (payload) => { ... },
 * });
 * ```
 */
export function useRealtime(options: UseRealtimeOptions) {
  const {
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onAny,
    enabled = true,
  } = options;

  // Use refs so callback changes don't re-subscribe
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const onAnyRef = useRef(onAny);

  onInsertRef.current = onInsert;
  onUpdateRef.current = onUpdate;
  onDeleteRef.current = onDelete;
  onAnyRef.current = onAny;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime:${table}:${filter || 'all'}:${Math.random().toString(36).slice(2, 6)}`;

    const channelConfig: any = {
      event: '*',
      schema: 'public',
      table,
    };
    if (filter) {
      channelConfig.filter = filter;
    }

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        channelConfig,
        (payload: any) => {
          const eventType = payload.eventType as RealtimeEvent;

          // Fire specific callback
          if (eventType === 'INSERT' && onInsertRef.current) {
            onInsertRef.current(payload);
          } else if (eventType === 'UPDATE' && onUpdateRef.current) {
            onUpdateRef.current(payload);
          } else if (eventType === 'DELETE' && onDeleteRef.current) {
            onDeleteRef.current(payload);
          }

          // Fire the catch-all callback
          if (onAnyRef.current) {
            onAnyRef.current(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, enabled]);
}
