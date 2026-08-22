import cloudinary from '../config/cloudinary.config';

export async function uploadToCloudinary(base64Data: string): Promise<string> {
  const dataUri = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'radiance/skin-scans',
    resource_type: 'image',
  });
  return result.secure_url;
}

export async function uploadProductImage(base64Data: string): Promise<string> {
  const dataUri = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'radiance/products',
    resource_type: 'image',
  });
  return result.secure_url;
}

/**
 * Recovers the Cloudinary `public_id` from a stored delivery URL.
 *
 * We only ever persist `secure_url`, so deletion has to work backwards to the
 * id. Parsing rather than storing the id in a new column is deliberate: a new
 * column would only ever cover future uploads, leaving every photo existing
 * users already uploaded orphaned forever.
 *
 * Safe to parse because we control the upload options — our URLs never carry
 * transformation segments. Anything that isn't ours returns null and is left
 * alone, which matters for `User.avatarUrl`: that's usually a Clerk-hosted
 * image, not something we may delete.
 */
export function publicIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'res.cloudinary.com') return null;

  const marker = '/upload/';
  const at = parsed.pathname.indexOf(marker);
  if (at === -1) return null;

  const path = parsed.pathname
    .slice(at + marker.length)
    // Drop the version segment (`v1712345678/`) when Cloudinary included one.
    .replace(/^v\d+\//, '')
    // The extension isn't part of the public_id.
    .replace(/\.[^./]+$/, '');

  return path ? decodeURIComponent(path) : null;
}

/**
 * Best-effort removal of stored images.
 *
 * Callers run this *after* the owning DB rows are gone, so a Cloudinary failure
 * must never propagate — it would fail a request whose real work has already
 * committed. Failures are logged instead.
 */
export async function deleteFromCloudinary(urls: (string | null | undefined)[]): Promise<void> {
  const publicIds = [
    ...new Set(urls.map(publicIdFromUrl).filter((id): id is string => id !== null)),
  ];

  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn(`[cloudinary] Failed to delete ${publicId}:`, err);
      }
    }),
  );
}
