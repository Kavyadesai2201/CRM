// /client/src/hooks/useEventStream.js
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const MAX_FEED_SIZE = 50; // cap the in-memory feed so it doesn't grow unbounded between polls

/**
 * Opens a Server-Sent Events connection to /api/stream.
 *
 * Handles two server event types:
 *   - 'message' → prepend to the ['messages','recent'] cache (dedupe by id)
 *   - 'stage'   → invalidate leads / pipeline caches so Kanban and Leads
 *                  pages re-sync
 *
 * The browser's EventSource auto-reconnects on network drops; we just need to
 * close the connection on unmount to prevent listener leaks.
 */
export function useEventStream() {
  const qc = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (!token) return; // not logged in — nothing to do

    const url = `/api/stream?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);

    es.onmessage = (e) => {
      let event;
      try { event = JSON.parse(e.data); } catch { return; }

      if (event.type === 'message') {
        const msg = event.payload;
        qc.setQueryData(['messages', 'recent'], (old) => {
          if (!old) return old;
          // Skip if we already have this message (reconnect replay guard)
          if (old.messages?.some(m => m.id === msg.id)) return old;
          return {
            ...old,
            messages: [msg, ...(old.messages ?? [])].slice(0, MAX_FEED_SIZE),
          };
        });
      } else if (event.type === 'stage') {
        // Invalidate both query shapes used across the app
        qc.invalidateQueries({ queryKey: ['leads-all'] });
        qc.invalidateQueries({ queryKey: ['leads'] });
        qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      }
    };

    es.onerror = () => {
      // EventSource handles reconnection automatically — log only
      console.warn('[SSE] Connection interrupted — browser will reconnect');
    };

    return () => {
      es.close();
    };
  }, [qc]);
}
