import { reportNetworkFailure } from '../lib/connectivity';
import { ERROR_TYPES } from '../lib/errors';
import { getBaseUrl } from './baseUrl';

export interface ApiError {
  success: false;
  type: string;
  message: string;
  details?: Record<string, string>;
}

export interface ApiCallOptions extends RequestInit {
  /** Abort and fail as a TIMEOUT_ERROR after this long. */
  timeoutMs?: number;
}

// Without a timeout, a request on a routable-but-dead network (captive portal,
// VPN with no upstream) hangs until the platform's TCP timeout, so queries never
// settle and screens sit on a skeleton indefinitely. These are backstops, not
// latency budgets — they must sit comfortably above how long a healthy request
// can legitimately take.
//
// 45s rather than 30s because a healthy request on EDGE/congested cellular can
// genuinely run past 30s, and aborting it used to tell the user they had no
// connection. Affordable because a timeout is terminal (no retries — see the
// retry predicate in `app/_layout.tsx`), and a truly dead network fails in
// milliseconds rather than waiting this out.
const DEFAULT_TIMEOUT_MS = 45_000;

// AI endpoints are in a different league: `openAIService.ts` allows 30s *per*
// OpenAI call and several of these chain more than one (analyze also builds the
// routine), so a healthy request can run well past a minute.
const SLOW_TIMEOUT_MS = 180_000;

const SLOW_ENDPOINTS = [
  /^\/skin-profile\/analyze/,
  /^\/skin-profile\/weekly-plan/,
  /^\/routines\/insight/,
  /^\/products\/extract-ingredients/,
  /^\/products\/[^/]+\/analysis/,
];

function defaultTimeoutFor(url: string): number {
  return SLOW_ENDPOINTS.some((re) => re.test(url)) ? SLOW_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

export async function apiCall<T = unknown>(url: string, options: ApiCallOptions): Promise<T> {
  const { timeoutMs = defaultTimeoutFor(url), signal, ...init } = options;

  const controller = new AbortController();
  let timedOut = false;
  let cancelled = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // Honour a caller-supplied signal alongside the timeout. Tracked separately
  // from `timedOut` so a deliberate cancellation isn't mistaken for a failure.
  const onExternalAbort = () => {
    cancelled = true;
    controller.abort();
  };
  if (signal) {
    if (signal.aborted) {
      cancelled = true;
      controller.abort();
    } else signal.addEventListener?.('abort', onExternalAbort);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${url}`, { ...init, signal: controller.signal });
  } catch {
    // `fetch` throws a raw `TypeError: Network request failed` when the request
    // can't reach the server (offline, DNS, backend down), and an AbortError
    // when someone aborts it.
    //
    // Only the first of these says anything about connectivity. An abort is
    // evidence about *this* request and nothing more — reporting our own timeout
    // as a network failure is what previously turned one slow AI call into
    // app-wide NETWORK_ERRORs, and describing it as one is what told users on a
    // merely slow connection that they were offline.
    if (cancelled) throw { type: ERROR_TYPES.CANCELLED, message: 'Request cancelled' };
    if (timedOut) throw { type: ERROR_TYPES.TIMEOUT, message: 'Request timed out' };
    reportNetworkFailure();
    throw { type: ERROR_TYPES.NETWORK, message: 'Network request failed' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onExternalAbort);
  }

  if (response.status === 204) return null as T;

  let data: T;
  try {
    data = await response.json();
  } catch {
    // The server answered, so this isn't a connectivity problem — don't report
    // a network failure here, it's a bad payload.
    throw {
      type: ERROR_TYPES.BAD_RESPONSE,
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
