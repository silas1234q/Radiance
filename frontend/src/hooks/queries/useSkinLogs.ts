import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useTrack } from '../useTrack';
import type { SkinLog } from '../../types/api';

export function useCreateSkinLog() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: (data: { lifestyleFactors: string[]; notes?: string; photoUrl?: string }) =>
      api.fetch<SkinLog>('/skin-logs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      // Shape only. The lifestyle factors and notes are health data the user
      // wrote about themselves; how *many* they picked tells us whether the
      // form is worth its length, which is all analytics needs.
      track('skin_log_created', {
        factor_count: vars.lifestyleFactors.length,
        has_notes: !!vars.notes?.trim(),
        has_photo: !!vars.photoUrl,
      });
      queryClient.invalidateQueries({ queryKey: ['skinLogs'] });
    },
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
