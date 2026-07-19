import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
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
  });
}

export function useAnalyzeSkin() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.fetch<SkinProfile>('/skin-profile/analyze', { method: 'POST' }),
    onSuccess: () => {
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
    mutationFn: (photoUrl: string) =>
      api.fetch<SkinProfile>('/skin-profile/analyze-with-scan', {
        method: 'POST',
        body: JSON.stringify({ photoUrl }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skinProfile'] });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['skinScores'] });
    },
  });
}
