import type { ApiError } from '../api/apiClient';

/**
 * The frontend can receive errors in a few shapes:
 *  - `ApiError` plain objects thrown by `apiClient.ts` ({ success, type, message, details })
 *  - the client-side failure types below, thrown by `apiClient.ts` / `uploadPhoto.ts`
 *  - real `Error` instances (e.g. `useApi.ts` throws `new Error('Not authenticated')`)
 *  - Clerk errors ({ errors: [{ message }] })
 * These helpers normalize all of them so callers/handlers read errors the same way.
 */

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Client-side failure types. These used to all be `NETWORK_ERROR`, which meant a
 * request that merely took too long — or a proxy handing back HTML — told the
 * user "check your internet". They're separate now because only `NETWORK_ERROR`
 * says anything at all about connectivity.
 */
export const ERROR_TYPES = {
  /** The transport failed outright: offline, DNS, backend unreachable. */
  NETWORK: 'NETWORK_ERROR',
  /** *We* aborted after our own time budget. The connection may be perfectly fine. */
  TIMEOUT: 'TIMEOUT_ERROR',
  /** The server answered, but the body wasn't JSON (captive portal, proxy error page). */
  BAD_RESPONSE: 'BAD_RESPONSE',
  /** The caller aborted deliberately. Never surfaced to the user. */
  CANCELLED: 'CANCELLED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

/** Friendlier copy for known error `type`s. */
const TYPE_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'No connection. Check your internet and try again.',
  TIMEOUT_ERROR: 'This is taking longer than usual. Please try again.',
  BAD_RESPONSE: 'We got an unexpected response from the server. Please try again.',
  UNAUTHORIZED: 'Your session expired. Please sign in again.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getErrorType(err: unknown): string | undefined {
  if (isRecord(err) && typeof err.type === 'string') return err.type;
  return undefined;
}

/**
 * A genuine transport failure — and *only* that. Deliberately narrow: this is
 * what gates the "no connection" messaging and the connectivity probe, so a slow
 * request or a bad payload must not qualify.
 */
export function isNetworkError(err: unknown): boolean {
  return getErrorType(err) === ERROR_TYPES.NETWORK;
}

/** We gave up waiting. Says nothing about whether the network works. */
export function isTimeoutError(err: unknown): boolean {
  return getErrorType(err) === ERROR_TYPES.TIMEOUT;
}

/** The server answered with something we couldn't parse. */
export function isBadResponseError(err: unknown): boolean {
  return getErrorType(err) === ERROR_TYPES.BAD_RESPONSE;
}

/** We asked for this — never retry it, never toast it. */
export function isCancelledError(err: unknown): boolean {
  return getErrorType(err) === ERROR_TYPES.CANCELLED;
}

export function isUnauthorizedError(err: unknown): boolean {
  return getErrorType(err) === ERROR_TYPES.UNAUTHORIZED;
}

export function getErrorMessage(err: unknown, fallback: string = DEFAULT_MESSAGE): string {
  // Known type → friendly copy takes precedence over the raw server message.
  const type = getErrorType(err);
  if (type && TYPE_MESSAGES[type]) return TYPE_MESSAGES[type];

  // ApiError / plain object with a message
  if (isRecord(err)) {
    const apiErr = err as Partial<ApiError>;
    if (typeof apiErr.message === 'string' && apiErr.message.trim()) {
      return apiErr.message;
    }
    // Clerk-style error shape: { errors: [{ message }] }
    const clerkErrors = (err as { errors?: unknown }).errors;
    if (Array.isArray(clerkErrors)) {
      const first = clerkErrors[0];
      if (isRecord(first) && typeof first.message === 'string' && first.message.trim()) {
        return first.message;
      }
    }
  }

  // Real Error instance
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  if (typeof err === 'string' && err.trim()) return err;

  return fallback;
}
