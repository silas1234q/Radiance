import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '@clerk/clerk-expo';

interface ScanCreditsResponse {
  availableCredits: number;
  freeScansRemaining: number;
  weekResetsAt: string | null;
}

export function useScanCredits() {
  const api = useApi();
    const { isSignedIn } = useAuth()
  return useQuery({
    queryKey: ['scanCredits'],
    queryFn: () => api.fetch<ScanCreditsResponse>('/scan-credits'),
    enabled:!!isSignedIn
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
