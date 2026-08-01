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
