import { useQuery, useMutation, useQueryClient, type MutateOptions } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useTrack } from '../useTrack';
import {
  MUTATION_KEYS,
  now,
  type CompleteRoutineVars,
  type ToggleStepVars,
} from '../../lib/mutationDefaults';
import type { Routine, RoutineStep, DetailedInsight } from '../../types/api';

/**
 * Feature-usage events live on the mutation hooks rather than the screens.
 * Every routine action funnels through here, so instrumenting one layer covers
 * every call site and can't be missed when a new screen reuses a hook.
 *
 * The two offline-queued mutations (complete, toggle) track at tap time, not on
 * success: the tap is the usage, and a write that replays three hours later
 * shouldn't be dated three hours later. PostHog queues its own events offline,
 * so nothing is lost either way.
 */

/** Rollback context for the optimistic routine updates. */
type RoutinesSnapshot = { previous?: Routine[] };

export function useRoutines() {
  const api = useApi();
  return useQuery({
    queryKey: ['routines'],
    queryFn: () => api.fetch<Routine[]>('/routines'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteRoutine() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: (routineId: string) =>
      api.fetch(`/routines/${routineId}`, { method: 'DELETE' }),
    onSuccess: (_data, routineId) => {
      track('routine_deleted', { routine_id: routineId });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useDeleteStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: ({ routineId, stepId }: { routineId: string; stepId: string }) =>
      api.fetch(`/routines/${routineId}/steps/${stepId}`, { method: 'DELETE' }),
    onSuccess: (_data, { routineId }) => {
      track('routine_step_deleted', { routine_id: routineId });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine-insight-detailed'] });
    },
  });
}

export function useAddStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: ({ routineId, name, description, productId }: {
      routineId: string; name: string; description?: string; productId?: string;
    }) => api.fetch<RoutineStep>(`/routines/${routineId}/steps`, {
      method: 'POST',
      body: JSON.stringify({ name, description, productId }),
    }),
    onSuccess: (_data, { routineId, productId }) => {
      // Step names are user-authored free text — only whether a product was
      // attached, which is the thing worth knowing about shelf adoption.
      track('routine_step_added', { routine_id: routineId, has_product: !!productId });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine-insight-detailed'] });
    },
  });
}

export interface RoutineReminderInput {
  reminderEnabled?: boolean;
  amReminderTime?: string | null;
  pmReminderTime?: string | null;
}

export function useCreateCustomRoutine() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: ({ name, ...reminder }: { name: string } & RoutineReminderInput) =>
      api.fetch<Routine>('/routines/custom', {
        method: 'POST',
        body: JSON.stringify({ name, ...reminder }),
      }),
    onSuccess: (_data, vars) => {
      track('routine_created', { has_reminder: !!vars.reminderEnabled });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useUpdateRoutine() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: ({
      routineId,
      data,
    }: {
      routineId: string;
      data: RoutineReminderInput & { name?: string; category?: string; isActive?: boolean };
    }) =>
      api.fetch<Routine>(`/routines/${routineId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, { routineId, data }) => {
      // Which fields were edited, never their values — routine names are free
      // text. Sorted so the property groups cleanly in PostHog.
      track('routine_updated', {
        routine_id: routineId,
        fields: Object.keys(data).sort().join(','),
      });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    },
  });
}

export function useUpdateStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: ({ routineId, stepId, data }: {
      routineId: string;
      stepId: string;
      data: { name?: string; description?: string; productId?: string | null };
    }) => api.fetch<RoutineStep>(`/routines/${routineId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: (_data, { routineId }) => {
      track('routine_step_updated', { routine_id: routineId });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine-insight-detailed'] });
    },
  });
}

export function useReorderSteps() {
  const api = useApi();
  const track = useTrack();
  return useMutation({
    mutationFn: ({ routineId, stepIds }: { routineId: string; stepIds: string[] }) =>
      api.fetch(`/routines/${routineId}/steps/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ stepIds }),
      }),
    onSuccess: (_data, { routineId, stepIds }) => {
      track('routine_steps_reordered', { routine_id: routineId, step_count: stepIds.length });
    },
  });
}

export function useDetailedInsight(routineId?: string, enabled = true) {
  const api = useApi();
  const queryParam = routineId ? `?routineId=${routineId}` : '';
  return useQuery({
    queryKey: ['routine-insight-detailed', routineId ?? 'all'],
    queryFn: () => api.fetch<DetailedInsight>(`/routines/insight/detailed${queryParam}`),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Completing a routine and ticking a step are queued when offline: no
 * `mutationFn` or `onSettled` here, they come from the mutation defaults keyed
 * by `mutationKey` (see `lib/mutationDefaults.ts`) so a write persisted across
 * a force-quit can still find its function on replay. `onMutate` stays local —
 * it runs at tap time and its optimistic write to `['routines']` is itself
 * persisted, so the tick survives a restart even before the write goes out.
 */
export function useCompleteRoutine() {
  const queryClient = useQueryClient();
  const track = useTrack();
  const mutation = useMutation<Routine, unknown, CompleteRoutineVars, RoutinesSnapshot>({
    mutationKey: MUTATION_KEYS.completeRoutine,
    onMutate: async ({ routineId }) => {
      await queryClient.cancelQueries({ queryKey: ['routines'] });
      const previous = queryClient.getQueryData<Routine[]>(['routines']);
      queryClient.setQueryData<Routine[]>(['routines'], (old) => {
        if (!old) return old;
        return old.map((routine) => {
          if (routine.id !== routineId) return routine;
          return {
            ...routine,
            steps: routine.steps.map((step) => ({
              ...step,
              isCompleted: true,
              completedAt: new Date().toISOString(),
            })),
          };
        });
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['routines'], context.previous);
    },
  });

  // Keeps the call-site API as `mutate(routineId)` while stamping the tap time
  // the queue needs for correct day attribution.
  return {
    ...mutation,
    mutate: (routineId: string, options?: MutateOptions<Routine, unknown, CompleteRoutineVars>) => {
      track('routine_completed', { routine_id: routineId });
      return mutation.mutate({ routineId, occurredAt: now() }, options);
    },
    mutateAsync: (routineId: string) => {
      track('routine_completed', { routine_id: routineId });
      return mutation.mutateAsync({ routineId, occurredAt: now() });
    },
  };
}

export function useToggleStep() {
  const queryClient = useQueryClient();
  const track = useTrack();
  const mutation = useMutation<RoutineStep, unknown, ToggleStepVars, RoutinesSnapshot>({
    mutationKey: MUTATION_KEYS.toggleStep,
    onMutate: async ({ routineId, stepId }) => {
      await queryClient.cancelQueries({ queryKey: ['routines'] });
      const previous = queryClient.getQueryData<Routine[]>(['routines']);
      queryClient.setQueryData<Routine[]>(['routines'], (old) => {
        if (!old) return old;
        return old.map((routine) => {
          if (routine.id !== routineId) return routine;
          return {
            ...routine,
            steps: routine.steps.map((step) =>
              step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
            ),
          };
        });
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['routines'], context.previous);
    },
  });

  return {
    ...mutation,
    mutate: (vars: { routineId: string; stepId: string }) => {
      track('routine_step_toggled', { routine_id: vars.routineId });
      return mutation.mutate({ ...vars, occurredAt: now() });
    },
    mutateAsync: (vars: { routineId: string; stepId: string }) => {
      track('routine_step_toggled', { routine_id: vars.routineId });
      return mutation.mutateAsync({ ...vars, occurredAt: now() });
    },
  };
}
