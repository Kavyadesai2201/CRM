// /client/src/hooks/useLeads.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../services/api.js";

export const useLeadAI = () =>
  useMutation({
    mutationFn: ({ id, mode }) => leadsApi.ai(id, mode),
  });

export const useLeads = (params = {}) =>
  useQuery({ queryKey: ["leads", params], queryFn: () => leadsApi.getAll(params) });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leadsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
};

export const useDeleteLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leadsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
};
