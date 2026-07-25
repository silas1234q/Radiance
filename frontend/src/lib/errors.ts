import type { ApiError } from '../api/apiClient';

/**
 * The frontend can receive errors in a few shapes:
 *  - `ApiError` plain objects thrown by `apiClient.ts` ({ success, type, message, details })
 *  - `{ type: 'NETWORK_ERROR', message }` from the JSON-parse failure path in `apiClient.ts`
 *  - real `Error` instances (e.g. `useApi.ts` throws `new Error('Not authenticated')`)
 *  - Clerk errors ({ errors: [{ message }] })
 * These helpers normalize all of them so callers/handlers read errors the same way.
 */

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

/** Friendlier copy for known error `type`s. */
const TYPE_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'No connection. Check your internet and try again.',
  UNAUTHORIZED: 'Your session expired. Please sign in again.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getErrorType(err: unknown): string | undefined {
  if (isRecord(err) && typeof err.type === 'string') return err.type;
  return undefined;
}

export function isNetworkError(err: unknown): boolean {
  return getErrorType(err) === 'NETWORK_ERROR';
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
