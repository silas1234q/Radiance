import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { SkinLog } from '../../types/api';

export function useCreateSkinLog() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { lifestyleFactors: string[]; notes?: string; photoUrl?: string }) =>
      api.fetch<SkinLog>('/skin-logs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skinLogs'] }),
  });
}

export function useSkinLogs() {
  const api = useApi();
  return useQuery({
    queryKey: ['skinLogs'],
    queryFn: () => api.fetch<SkinLog[]>('/skin-logs'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTodaySkinLog() {
  const api = useApi();
  return useQuery({
    queryKey: ['skinLogs', 'today'],
    queryFn: async () => {
      const res = await api.fetch<SkinLog | null>('/skin-logs/today');
      return res ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
