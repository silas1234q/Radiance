import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect } from 'react';
import { authedFetch } from '../api/authedFetch';
import type { ApiCallOptions } from '../api/apiClient';
import { setClerkAuth } from '../lib/authToken';

export function useApi() {
  const { getToken, isSignedIn } = useAuth();

  // Keep the module-level registry in sync so the offline mutation queue can
  // authenticate its replays from outside React.
  useEffect(() => {
    setClerkAuth(getToken, isSignedIn);
  }, [getToken, isSignedIn]);

  const authenticatedFetch = useCallback(
    <T = unknown>(url: string, options: ApiCallOptions = {}): Promise<T> =>
      // Pass this hook's live Clerk values rather than relying on the registry,
      // so the very first request can't race the effect above.
      authedFetch<T>(url, options, { getToken, isSignedIn }),
    [getToken, isSignedIn]
  );

  return { fetch: authenticatedFetch };
}

/**
 * Hook for manual (non-query) call sites that need a token.
 * Returns null on failure instead of emitting session expired — callers should
 * show a toast rather than signing the user out.
 */
export function useGetToken() {
  const { getToken, isSignedIn } = useAuth();

  return useCallback(async (): Promise<string | null> => {
    if (isSignedIn === false) return null;
    // Retry a few times in case Clerk is still hydrating.
    for (let i = 0; i < 3; i++) {
      const token = await getToken();
      if (token) return token;
      if (i < 2) await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  }, [getToken, isSignedIn]);
}
