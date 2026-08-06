/**
 * Offline write queue.
 *
 * Writes that a user reasonably expects to work with no signal — completing a
 * routine, ticking a step, logging a mood, autosaving the skin log — are given
 * `networkMode: 'online'`. React Query then *pauses* them instead of failing
 * them when we're offline, the persister writes paused mutations to
 * AsyncStorage, and `QueryClient.mount()` replays them (in order) as soon as
 * `onlineManager` flips back to online.
 *
 * The `mutationFn` has to live here rather than in the hook: a mutation
 * restored from AsyncStorage after a cold start carries only its key and its
 * variables, so the function must be reachable from the mutation key alone. A
 * hook-supplied `mutationFn` would silently win over this default and the
 * restored write would never replay.
 *
 * Everything not registered here keeps the old fail-fast behaviour via the
 * `networkMode: 'offlineFirst'` mutation default in `_layout.tsx`.
 */
import type { QueryClient } from '@tanstack/react-query';
import { authedFetch } from '../api/authedFetch';
import { isUnauthorizedError } from './errors';
import type { MoodEntry, Routine, RoutineStep, SkinLog } from '../types/api';

export const MUTATION_KEYS = {
  completeRoutine: ['routines', 'complete'],
  toggleStep: ['routines', 'toggle-step'],
  logMood: ['moods', 'create'],
  autoSaveSkinLog: ['skin-logs', 'autosave'],
} as const;

/**
 * `occurredAt` is stamped when the user taps, not when the request finally
 * goes out. Without it, a PM routine completed at 11pm offline and replayed at
 * 7am would be credited to the wrong day and break the streak.
 */
export interface CompleteRoutineVars {
  routineId: string;
  occurredAt: string;
}

export interface ToggleStepVars {
  routineId: string;
  stepId: string;
  occurredAt: string;
}

export interface LogMoodVars {
  mood: string;
  occurredAt: string;
}

export type AutoSaveSkinLogVars = Record<string, unknown>;

/** Stamp for `occurredAt` at the moment of the user's action. */
export function now(): string {
  return new Date().toISOString();
}

// A queued write that fails on replay for a non-auth reason is worth one more
// go; while offline these retries pause rather than burn attempts.
const retry = (count: number, error: unknown) => !isUnauthorizedError(error) && count < 2;

export function registerMutationDefaults(queryClient: QueryClient): void {
  const invalidateRoutineProgress = () => {
    queryClient.invalidateQueries({ queryKey: ['routines'] });
    queryClient.invalidateQueries({ queryKey: ['gamification'] });
  };

  queryClient.setMutationDefaults(MUTATION_KEYS.completeRoutine, {
    networkMode: 'online',
    retry,
    mutationFn: ({ routineId, occurredAt }: CompleteRoutineVars) =>
      authedFetch<Routine>(`/routines/${routineId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ occurredAt }),
      }),
    onSettled: invalidateRoutineProgress,
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.toggleStep, {
    networkMode: 'online',
    retry,
    mutationFn: ({ routineId, stepId, occurredAt }: ToggleStepVars) =>
      authedFetch<RoutineStep>(`/routines/${routineId}/steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify({ occurredAt }),
      }),
    onSettled: invalidateRoutineProgress,
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.logMood, {
    networkMode: 'online',
    retry,
    mutationFn: ({ mood, occurredAt }: LogMoodVars) =>
      authedFetch<MoodEntry>('/moods', {
        method: 'POST',
        body: JSON.stringify({ mood, occurredAt }),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['moods'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  queryClient.setMutationDefaults(MUTATION_KEYS.autoSaveSkinLog, {
    networkMode: 'online',
    retry,
    mutationFn: (data: AutoSaveSkinLogVars) =>
      authedFetch<SkinLog>('/skin-logs/today', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['skinLogs'] });
    },
  });
}
