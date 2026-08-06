import { markOffline } from '../lib/connectivity';
import { getBaseUrl } from './baseUrl';

export interface ApiError {
  success: false;
  type: string;
  message: string;
  details?: Record<string, string>;
}

export interface ApiCallOptions extends RequestInit {
  /** Abort and fail as a NETWORK_ERROR after this long. */
  timeoutMs?: number;
}

// Without this a request to a routable-but-dead network (captive portal, VPN
// with no upstream) hangs until the platform's TCP timeout, so queries never
// settle and screens sit on a skeleton indefinitely.
const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiCall<T = unknown>(url: string, options: ApiCallOptions): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Honour a caller-supplied signal alongside the timeout.
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener?.('abort', onExternalAbort);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${url}`, { ...init, signal: controller.signal });
  } catch {
    // `fetch` throws a raw `TypeError: Network request failed` when the request
    // can't reach the server (offline, DNS, backend down), and an AbortError on
    // our timeout. Both mean the same thing to callers: we couldn't get through.
    // Flag it so the rest of the app stops treating failures as auth problems.
    markOffline();
    throw { type: 'NETWORK_ERROR', message: 'Network request failed' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onExternalAbort);
  }

  if (response.status === 204) return null as T;

  let data: T;
  try {
    data = await response.json();
  } catch {
    // The server answered, so this isn't a connectivity problem — don't
    // `markOffline()` here, it's a bad payload.
    throw {
      type: 'NETWORK_ERROR',
      message: 'Invalid server response',
    };
  }

  if (!response.ok) {
    const error: ApiError = data as unknown as ApiError;
    if (response.status === 401) {
      (error as any).status = 401;
    }
    throw error;
  }
  return data;
}

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export { getBaseUrl };
