import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { MUTATION_KEYS, now, type LogMoodVars } from '../../lib/mutationDefaults';
import type { MoodEntry } from '../../types/api';

export function useMoods() {
  const api = useApi();
  return useQuery({
    queryKey: ['moods'],
    queryFn: () => api.fetch<MoodEntry[]>('/moods'),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Queued when offline — `mutationFn` and `onSettled` come from the mutation
 * defaults keyed by `mutationKey` (see `lib/mutationDefaults.ts`).
 */
export function useLogMood() {
  const mutation = useMutation<MoodEntry, unknown, LogMoodVars>({
    mutationKey: MUTATION_KEYS.logMood,
  });

  // Call sites keep passing a bare mood string; the tap time is stamped here so
  // a replayed log lands on the day it was logged.
  return {
    ...mutation,
    mutate: (mood: string) => mutation.mutate({ mood, occurredAt: now() }),
    mutateAsync: (mood: string) => mutation.mutateAsync({ mood, occurredAt: now() }),
  };
}
