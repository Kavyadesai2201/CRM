import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, messagesApi, whatsappApi, instagramApi } from "../services/api";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => analyticsApi.getDashboardStats(),
    refetchInterval: 30000,
    staleTime: 25000,
    retry: 2,
  });
};

export const useRecentMessages = (params = {}) => {
  return useQuery({
    queryKey: ["messages", "recent"],
    queryFn: () => messagesApi.getRecent(params),
    refetchInterval: 60000, // SSE is the primary path; poll is a fallback
    staleTime: 10000,
    retry: 2,
    select: (data) => data,
  });
};

export const useSendWhatsAppMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ to, message }) => whatsappApi.sendMessage({ to, message }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", "recent"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (err) => {
      console.error("Failed to send WhatsApp message:", err);
    },
  });
};

export const useSendInstagramReply = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, message, leadId }) =>
      instagramApi.replyToComment({ commentId, message, leadId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", "recent"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (err) => {
      console.error("Failed to send Instagram reply:", err);
    },
  });
};
