import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { SkinScore } from '../../types/api';

export function useSkinScores() {
  const api = useApi();
  return useQuery({
    queryKey: ['skinScores'],
    queryFn: () => api.fetch<SkinScore[]>('/skin-scores'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLatestScore() {
  const api = useApi();
  return useQuery({
    queryKey: ['skinScores', 'latest'],
    queryFn: () => api.fetch<SkinScore>('/skin-scores/latest'),
    staleTime: 5 * 60 * 1000,
  });
}
