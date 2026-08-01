import * as FileSystem from 'expo-file-system/legacy';
import { getBaseUrl } from './apiClient';

async function readAsBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:image/jpeg;base64,${base64}`;
}

export async function uploadSkinPhoto(uri: string, token: string): Promise<string> {
  const photo = await readAsBase64(uri);

  const response = await fetch(`${getBaseUrl()}/upload/skin-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photo }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload photo');
  }

  const data = await response.json();
  return data.url;
}

export async function uploadProductPhoto(uri: string, token: string): Promise<string> {
  const photo = await readAsBase64(uri);

  const response = await fetch(`${getBaseUrl()}/upload/product-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photo }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload photo');
  }

  const data = await response.json();
  return data.url;
}
