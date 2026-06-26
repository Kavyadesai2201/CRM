// /client/src/hooks/useInbox.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi, messagesApi, whatsappApi } from "../services/api.js";

// Fetches the lead list for the Inbox, ordered by last activity.
// Accepts { search, source, orderBy } from the Inbox filter state.
export function useLeadList(params) {
  return useQuery({
    queryKey: ["inbox-leads", params],
    queryFn:  () => leadsApi.getAll({ ...params, orderBy: "last_activity_at", limit: 50 }),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous results visible while fetching new page
  });
}

// Fetches the full message thread for a single lead.
// staleTime: Infinity because the SSE stream (useEventStream) keeps this fresh.
export function useConversation(leadId) {
  return useQuery({
    queryKey: ["messages", "conversation", leadId],
    queryFn:  () => messagesApi.getByLead(leadId, { limit: 500 }),
    enabled:  !!leadId,
    staleTime: Infinity,
    // Returns raw { data: [...], pagination: {...} } so setQueryData in the
    // optimistic update and in useEventStream can operate on the same shape.
  });
}

// Sends a WhatsApp message and optimistically appends it to the open conversation.
export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ to, message }) => whatsappApi.sendMessage({ to, message }),

    onMutate: async ({ message, leadId }) => {
      if (!leadId) return;
      await qc.cancelQueries({ queryKey: ["messages", "conversation", leadId] });
      const prev = qc.getQueryData(["messages", "conversation", leadId]);

      const tempMsg = {
        id:        `temp-${Date.now()}`,
        direction: "outbound",
        channel:   "whatsapp",
        content:   message,
        sent_at:   new Date().toISOString(),
        lead_id:   leadId,
      };

      qc.setQueryData(["messages", "conversation", leadId], (old) => ({
        ...(old ?? {}),
        data: [...(old?.data ?? []), tempMsg],
      }));

      return { prev, leadId };
    },

    onSuccess: (_data, vars) => {
      // Replace temp message with the real DB row
      qc.invalidateQueries({ queryKey: ["messages", "conversation", vars.leadId] });
      qc.invalidateQueries({ queryKey: ["inbox-leads"] });
    },

    onError: (_err, _vars, context) => {
      // Roll back the optimistic message
      if (context?.leadId && context.prev !== undefined) {
        qc.setQueryData(["messages", "conversation", context.leadId], context.prev);
      }
    },
  });
}
