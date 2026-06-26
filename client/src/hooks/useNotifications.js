// /client/src/hooks/useNotifications.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api.js';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn:  notificationsApi.getAll,
    staleTime: Infinity,   // SSE keeps this fresh; no background polling needed
    select: (data) => Array.isArray(data) ? data : [],
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    // Optimistically mark everything read in the cache immediately
    onMutate: () => {
      qc.setQueryData(['notifications'], (old) =>
        (old ?? []).map(n => ({ ...n, read: true }))
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
