export interface ApiError {
  success: false;
  type: string;
  message: string;
  details?: Record<string, string>;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function apiCall<T = unknown>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}/api${url}`, options);

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
