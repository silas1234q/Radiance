import { getBaseUrl } from './apiClient';

export async function uploadSkinPhoto(uri: string, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: 'skin-photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await fetch(`${getBaseUrl()}/upload/skin-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload photo');
  }

  const data = await response.json();
  return data.url;
}

export async function uploadProductPhoto(uri: string, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    name: 'product-photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await fetch(`${getBaseUrl()}/upload/product-photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload photo');
  }

  const data = await response.json();
  return data.url;
}
