import * as FileSystem from 'expo-file-system/legacy';
import { markOffline } from '../lib/connectivity';
import { getBaseUrl } from './baseUrl';

async function readAsBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

// Uploads are base64 JSON bodies and can be large, so they get a longer leash
// than the 15s default in `apiClient`.
const UPLOAD_TIMEOUT_MS = 60_000;

/**
 * Photo uploads don't go through `apiCall` (they build their own body), so they
 * need the same NETWORK_ERROR normalization — otherwise a failed upload while
 * offline throws a raw `TypeError` that `isNetworkError()` doesn't recognize and
 * the user gets "Network request failed" instead of "No connection".
 */
async function postPhoto(path: string, uri: string, token: string): Promise<string> {
  const photo = await readAsBase64(uri);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photo }),
      signal: controller.signal,
    });
  } catch {
    markOffline();
    throw { type: 'NETWORK_ERROR', message: 'Network request failed' };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    if (response.status === 401) {
      throw { type: 'UNAUTHORIZED', status: 401, message: error.message || 'Upload failed' };
    }
    throw new Error(error.message || 'Failed to upload photo');
  }

  const data = await response.json();
  return data.url;
}

export function uploadSkinPhoto(uri: string, token: string): Promise<string> {
  return postPhoto('/upload/skin-photo', uri, token);
}

export function uploadProductPhoto(uri: string, token: string): Promise<string> {
  return postPhoto('/upload/product-photo', uri, token);
}
