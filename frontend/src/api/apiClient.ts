import { emitSessionExpired } from '../lib/sessionExpiry';

export interface ApiError {
  success: false;
  type: string;
  message: string;
  details?: Record<string, string>;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function apiCall<T = unknown>(url: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api${url}`, options);
  } catch {
    // `fetch` throws a raw `TypeError: Network request failed` when the request
    // can't reach the server (offline, DNS, backend down). Normalize it to the
    // ApiError-ish NETWORK_ERROR shape the rest of the app understands.
    throw { type: 'NETWORK_ERROR', message: 'Network request failed' };
  }

  if (response.status === 204) return null as T;

  let data: T;
  try {
    data = await response.json();
  } catch {
    throw {
      type: 'NETWORK_ERROR',
      message: 'Invalid server response',
    };
  }

  if (!response.ok) {
    const error: ApiError = data as unknown as ApiError;
    if (response.status === 401) {
      // "User not synced" means the Clerk token is valid but the DB row
      // doesn't exist yet (startup race during sign-up). This is NOT a real
      // session expiration — skip the sign-out side effect.
      const msg = (error?.message ?? '').toLowerCase();
      if (!msg.includes('user not synced')) {
        emitSessionExpired();
      }
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

export function getBaseUrl() {
  return `${BASE_URL}/api`;
}
