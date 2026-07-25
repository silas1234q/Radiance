import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { User, SkinProfile } from '../../types/api';

export function useProfile() {
  const api = useApi();
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.fetch<User>('/users/me'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; avatarUrl?: string }) =>
      api.fetch<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useDeleteAccount() {
  const api = useApi();
  return useMutation({
    mutationFn: () => api.fetch<null>('/users/me', { method: 'DELETE' }),
  });
}

export function useSkinProfile() {
  const api = useApi();
  return useQuery({
    queryKey: ['skinProfile'],
    queryFn: () => api.fetch<SkinProfile>('/skin-profile'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSkinProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      skinType?: string;
      sensitivityLevel?: string;
      skinTone?: string;
      concerns?: string[];
      allergies?: string[];
      routineLength?: string;
      productBudget?: string;
      ingredientsToAvoid?: string[];
    }) =>
      api.fetch<SkinProfile>('/skin-profile', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skinProfile'] });
      queryClient.invalidateQueries({ queryKey: ['weeklyPlan'] });
    },
  });
}
