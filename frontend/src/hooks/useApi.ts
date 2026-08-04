import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';
import { apiCall, authHeaders } from '../api/apiClient';
import { emitSessionExpired } from '../lib/sessionExpiry';

// Module-level singleton so concurrent callers share one retry loop.
let inflightTokenPromise: Promise<string> | null = null;

async function getTokenWithRetry(
  getToken: () => Promise<string | null>,
  isSignedIn: boolean | undefined,
  retries = 5,
  delay = 600,
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const token = await getToken();
    if (token) return token;
    // Clerk definitively says signed out — no point retrying further.
    if (isSignedIn === false) break;
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  emitSessionExpired();
  throw { type: 'UNAUTHORIZED', message: 'Your session expired. Please sign in again.' };
}

function deduplicatedGetToken(
  getToken: () => Promise<string | null>,
  isSignedIn: boolean | undefined,
): Promise<string> {
  if (inflightTokenPromise) return inflightTokenPromise;
  inflightTokenPromise = getTokenWithRetry(getToken, isSignedIn).finally(() => {
    inflightTokenPromise = null;
  });
  return inflightTokenPromise;
}

export function useApi() {
  const { getToken, isSignedIn } = useAuth();

  const authenticatedFetch = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const token = await deduplicatedGetToken(getToken, isSignedIn);

      return apiCall<T>(url, {
        ...options,
        headers: {
          ...authHeaders(token),
          ...options.headers,
        },
      });
    },
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
