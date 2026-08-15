import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useTrack } from '../useTrack';
import type { UserProduct } from '../../types/api';

export function useUserProducts() {
  const api = useApi();
  return useQuery({
    queryKey: ['userProducts'],
    queryFn: () => api.fetch<UserProduct[]>('/user-products'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRemoveUserProduct() {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrack();
  return useMutation({
    mutationFn: (productId: string) =>
      api.fetch(`/user-products/${productId}`, { method: 'DELETE' }),
    onSuccess: () => {
      track('product_removed_from_shelf');
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
    },
  });
}
