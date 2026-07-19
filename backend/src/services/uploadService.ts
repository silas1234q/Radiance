import cloudinary from '../config/cloudinary.config';
import fs from 'fs';

export async function uploadToCloudinary(filePath: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'radiance/skin-scans',
      resource_type: 'image',
    });
    return result.secure_url;
  } finally {
    fs.unlink(filePath, () => {});
  }
}

export async function uploadProductImage(filePath: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'radiance/products',
      resource_type: 'image',
    });
    return result.secure_url;
  } finally {
    fs.unlink(filePath, () => {});
  }
}
