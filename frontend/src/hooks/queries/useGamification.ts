import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { GamificationSummary, DailyCompletionData, StreakRestoreResult, XpHistoryEntry } from '../../types/api';

export function useGamification() {
  const api = useApi();
  return useQuery({
    queryKey: ['gamification'],
    queryFn: () => api.fetch<GamificationSummary>('/gamification'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useWeeklyCompletions() {
  const api = useApi();
  return useQuery({
    queryKey: ['gamification', 'weekly'],
    queryFn: () => api.fetch<DailyCompletionData[]>('/gamification/weekly'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useXpHistory(days: number = 30) {
  const api = useApi();
  return useQuery({
    queryKey: ['gamification', 'xp-history', days],
    queryFn: () => api.fetch<XpHistoryEntry[]>(`/gamification/xp-history?days=${days}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRestoreStreak() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<StreakRestoreResult>('/gamification/restore-streak', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}
