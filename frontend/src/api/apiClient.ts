import { reportNetworkFailure } from '../lib/connectivity';
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

// Without a timeout, a request on a routable-but-dead network (captive portal,
// VPN with no upstream) hangs until the platform's TCP timeout, so queries never
// settle and screens sit on a skeleton indefinitely. These are backstops, not
// latency budgets — they must sit comfortably above how long a healthy request
// can legitimately take.
const DEFAULT_TIMEOUT_MS = 30_000;

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
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
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
    // can't reach the server (offline, DNS, backend down), and an AbortError
    // when we abort it ourselves.
    //
    // Only the former says anything about connectivity — an abort we initiated
    // is evidence that *this* request was slow, nothing more. Reporting our own
    // timeout as a network failure is what previously turned one slow AI call
    // into app-wide NETWORK_ERRORs.
    if (!timedOut) reportNetworkFailure();
    throw {
      type: 'NETWORK_ERROR',
      message: timedOut ? 'Request timed out' : 'Network request failed',
    };
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
