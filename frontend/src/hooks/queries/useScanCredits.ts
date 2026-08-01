import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

interface ScanCreditsResponse {
  availableCredits: number;
  freeScansRemaining: number;
  weekResetsAt: string | null;
}

export function useScanCredits() {
  const api = useApi();
  return useQuery({
    queryKey: ['scanCredits'],
    queryFn: () => api.fetch<ScanCreditsResponse>('/scan-credits'),
  });
}

export function useVerifyScanPurchase() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) =>
      api.fetch<{ credits: number }>('/scan-credits/verify-purchase', {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanCredits'] });
    },
  });
}
