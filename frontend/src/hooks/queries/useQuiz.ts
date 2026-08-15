import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { markOnboarded } from '../../lib/appStateCache';
import type { QuizAnswer, SkinProfile } from '../../types/api';

export function useQuizAnswers() {
  const api = useApi();
  return useQuery({
    queryKey: ['quizAnswers'],
    queryFn: () => api.fetch<QuizAnswer[]>('/quiz'),
  });
}

export function useSubmitQuiz() {
  const api = useApi();
  return useMutation({
    mutationFn: (answers: { questionId: number; answer: string }[]) =>
      api.fetch<{ success: true; count: number }>('/quiz', { method: 'POST', body: JSON.stringify({ answers }) }),
    onSuccess: () => {
      // The backend defines "onboarded" as having quiz answers (see
      // `authService.ts`), so the moment this succeeds the user is onboarded.
      // Recording it now means the next cold start navigates straight to the
      // tabs instead of flashing the quiz while the backend confirms.
      void markOnboarded();
    },
  });
}

export function useAnalyzeSkin() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    // results.tsx renders its own retry UI for analysis failures.
    meta: { suppressErrorToast: true },
    // `buildRoutine: false` runs the free quiz-only analysis without generating
    // a routine (the "risk it" path); omitted/true builds the routine.
    mutationFn: (opts?: { buildRoutine?: boolean }) =>
      api.fetch<SkinProfile>('/skin-profile/analyze', {
        method: 'POST',
        body: JSON.stringify({ buildRoutine: opts?.buildRoutine ?? true }),
      }),
    onSuccess: (data) => {
      // Seed the cache so the results screen has real data immediately on reveal
      // (avoids a flash of empty content before the background refetch lands).
      queryClient.setQueryData(['skinProfile'], data);
      queryClient.invalidateQueries({ queryKey: ['skinProfile'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['skinScores'] });
    },
  });
}

export function useAnalyzeSkinWithScan() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    // results.tsx renders its own retry UI for analysis failures.
    meta: { suppressErrorToast: true },
    mutationFn: (photoUrl: string) =>
      api.fetch<SkinProfile>('/skin-profile/analyze-with-scan', {
        method: 'POST',
        body: JSON.stringify({ photoUrl }),
      }),
    onSuccess: (data) => {
      // Seed the cache so the results screen has real data immediately on reveal.
      queryClient.setQueryData(['skinProfile'], data);
      queryClient.invalidateQueries({ queryKey: ['skinProfile'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['skinScores'] });
    },
  });
}
