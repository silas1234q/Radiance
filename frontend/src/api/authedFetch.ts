/**
 * Authenticated fetch, shared by the `useApi()` hook and by the offline
 * mutation queue's non-hook `mutationFn`s.
 *
 * The important rule here: **a missing token is not proof of an expired
 * session.** Clerk's session JWT is short-lived and refreshing it requires a
 * round-trip to Clerk, so an offline device gets `null` back every single time.
 * The old code retried eight times and then signed the user out — which is
 * exactly the "session expired / logged out with data off" bug. Now we only
 * conclude the session is dead after confirming we can actually reach the
 * backend.
 */
import { apiCall, authHeaders, type ApiCallOptions } from './apiClient';
import { emitSessionExpired } from '../lib/sessionExpiry';
import { checkConnectivity, getIsOnline } from '../lib/connectivity';
import { getAuthSource, type AuthSource } from '../lib/authToken';

function networkError() {
  return { type: 'NETWORK_ERROR', message: 'Network request failed' };
}

// Module-level singleton so concurrent callers share one retry loop.
let inflightTokenPromise: Promise<string> | null = null;

async function getTokenWithRetry(
  auth: AuthSource,
  retries = 8,
  delay = 800,
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    // Known offline — retrying can't help, and burning 6.4s here just delays
    // the cached data the screen is waiting to show.
    if (!getIsOnline()) throw networkError();

    const token = await auth.getToken();
    if (token) return token;

    // Clerk definitively says signed out — no point retrying further.
    if (auth.isSignedIn === false) break;
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // Out of attempts. Before treating this as an expired session, verify we can
  // reach the backend — Clerk failing to mint a token and the network being
  // down look identical from here.
  if ((await checkConnectivity()) !== 'online') throw networkError();

  emitSessionExpired();
  throw { type: 'UNAUTHORIZED', message: 'Your session expired. Please sign in again.' };
}

function deduplicatedGetToken(auth: AuthSource): Promise<string> {
  if (inflightTokenPromise) return inflightTokenPromise;
  inflightTokenPromise = getTokenWithRetry(auth).finally(() => {
    inflightTokenPromise = null;
  });
  return inflightTokenPromise;
}

export async function authedFetch<T = unknown>(
  url: string,
  options: ApiCallOptions = {},
  auth: AuthSource = getAuthSource(),
): Promise<T> {
  const token = await deduplicatedGetToken(auth);

  try {
    return await apiCall<T>(url, {
      ...options,
      headers: {
        ...authHeaders(token),
        ...options.headers,
      },
    });
  } catch (error: any) {
    // On 401, force-refresh the token and retry once before giving up.
    if (error?.type === 'UNAUTHORIZED' || error?.status === 401) {
      const freshToken = await auth.getToken({ skipCache: true });
      if (freshToken && freshToken !== token) {
        try {
          return await apiCall<T>(url, {
            ...options,
            headers: {
              ...authHeaders(freshToken),
              ...options.headers,
            },
          });
        } catch (retryError: any) {
          // A 401 from our own server proves we reached it, so this one really
          // is a dead session.
          if (retryError?.type === 'UNAUTHORIZED' || retryError?.status === 401) {
            emitSessionExpired();
          }
          throw retryError;
        }
      }
      // Couldn't get a fresh token. Only a dead session if we're actually online.
      if ((await checkConnectivity()) !== 'online') throw networkError();
      emitSessionExpired();
    }
    throw error;
  }
}
