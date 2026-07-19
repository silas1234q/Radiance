import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';
import { apiCall, authHeaders } from '../api/apiClient';

async function getTokenWithRetry(
  getToken: () => Promise<string | null>,
  retries = 3,
  delay = 500,
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const token = await getToken();
    if (token) return token;
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Not authenticated');
}

export function useApi() {
  const { getToken } = useAuth();

  const authenticatedFetch = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const token = await getTokenWithRetry(getToken);

      return apiCall<T>(url, {
        ...options,
        headers: {
          ...authHeaders(token),
          ...options.headers,
        },
      });
    },
    [getToken]
  );

  return { fetch: authenticatedFetch };
}
