import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useTrack } from '../useTrack';
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
  const track = useTrack();
  const mutation = useMutation<MoodEntry, unknown, LogMoodVars>({
    mutationKey: MUTATION_KEYS.logMood,
  });

  // Call sites keep passing a bare mood string; the tap time is stamped here so
  // a replayed log lands on the day it was logged.
  //
  // The mood value itself is not tracked. Frequency of logging is the feature
  // signal; how someone felt on a given day is theirs, and PostHog is the wrong
  // place for it.
  return {
    ...mutation,
    mutate: (mood: string) => {
      track('mood_logged');
      return mutation.mutate({ mood, occurredAt: now() });
    },
    mutateAsync: (mood: string) => {
      track('mood_logged');
      return mutation.mutateAsync({ mood, occurredAt: now() });
    },
  };
}
