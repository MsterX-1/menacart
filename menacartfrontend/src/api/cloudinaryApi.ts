import axios from 'axios';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Uploads a single file to Cloudinary using unsigned upload.
 * Returns the raw secure_url and optimized URL.
 */
export const uploadImageToCloudinary = async (file: File): Promise<{ url: string; optimizedUrl: string }> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing in .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await axios.post<UploadResponse>(CLOUDINARY_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const secureUrl = response.data.secure_url;
    
    // Ensure we don't accidentally return base64
    if (secureUrl.startsWith('data:image')) {
      throw new Error('Upload returned a base64 string instead of a valid URL.');
    }

    return {
      url: secureUrl,
      optimizedUrl: getOptimizedImageUrl(secureUrl),
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to upload image');
  }
};
