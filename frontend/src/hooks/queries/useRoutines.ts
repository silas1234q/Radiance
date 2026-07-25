import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { Routine, RoutineStep, DetailedInsight } from '../../types/api';

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
  return useMutation({
    mutationFn: (routineId: string) =>
      api.fetch(`/routines/${routineId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useDeleteStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routineId, stepId }: { routineId: string; stepId: string }) =>
      api.fetch(`/routines/${routineId}/steps/${stepId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine-insight-detailed'] });
    },
  });
}

export function useAddStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routineId, name, description, productId }: {
      routineId: string; name: string; description?: string; productId?: string;
    }) => api.fetch<RoutineStep>(`/routines/${routineId}/steps`, {
      method: 'POST',
      body: JSON.stringify({ name, description, productId }),
    }),
    onSuccess: () => {
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
  return useMutation({
    mutationFn: ({ name, ...reminder }: { name: string } & RoutineReminderInput) =>
      api.fetch<Routine>('/routines/custom', {
        method: 'POST',
        body: JSON.stringify({ name, ...reminder }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useUpdateRoutine() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      routineId,
      data,
    }: {
      routineId: string;
      data: RoutineReminderInput & { name?: string; isActive?: boolean };
    }) =>
      api.fetch<Routine>(`/routines/${routineId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });
}

export function useUpdateStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routineId, stepId, data }: {
      routineId: string;
      stepId: string;
      data: { name?: string; description?: string; productId?: string | null };
    }) => api.fetch<RoutineStep>(`/routines/${routineId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine-insight-detailed'] });
    },
  });
}

export function useReorderSteps() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ routineId, stepIds }: { routineId: string; stepIds: string[] }) =>
      api.fetch(`/routines/${routineId}/steps/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ stepIds }),
      }),
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

export function useCompleteRoutine() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routineId: string) =>
      api.fetch<Routine>(`/routines/${routineId}/complete`, { method: 'POST' }),
    onMutate: async (routineId) => {
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

export function useToggleStep() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routineId, stepId }: { routineId: string; stepId: string }) =>
      api.fetch<RoutineStep>(`/routines/${routineId}/steps/${stepId}`, { method: 'PATCH' }),
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}
