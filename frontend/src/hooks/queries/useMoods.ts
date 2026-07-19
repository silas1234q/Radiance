import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { MoodEntry } from '../../types/api';

export function useMoods() {
  const api = useApi();
  return useQuery({
    queryKey: ['moods'],
    queryFn: () => api.fetch<MoodEntry[]>('/moods'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogMood() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mood: string) =>
      api.fetch<MoodEntry>('/moods', { method: 'POST', body: JSON.stringify({ mood }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}
