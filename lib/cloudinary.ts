import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';

// -----------------------------------------------------------------------------
// Cloudinary Configuration
// Supports either full CLOUDINARY_URL or individual env variables
// -----------------------------------------------------------------------------
const cloudinaryUrl = process.env.CLOUDINARY_URL;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary server-side instance
if (cloudinaryUrl) {
  cloudinary.config({
    cloudinary_url: cloudinaryUrl,
    secure: true,
  });
} else if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    (cloudinaryUrl && !cloudinaryUrl.includes('your-cloud-name')) ||
    (cloudName && apiKey && apiSecret && !cloudName.includes('your-cloud-name'))
  );
};

// -----------------------------------------------------------------------------
// Upload Helper (Server-side only)
// -----------------------------------------------------------------------------
export interface UploadImageResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload an image buffer or base64 data string to Cloudinary
 * Categorizes uploads into organized folders: e.g. 'ecommerce/products/clothes'
 */
export async function uploadProductImage(
  fileBase64OrUrl: string,
  folder: string = 'ecommerce/products',
  customOptions?: UploadApiOptions
): Promise<UploadImageResult> {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY ERROR: uploadProductImage must only be called on the server.');
  }

  const defaultOptions: UploadApiOptions = {
    folder,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    ...customOptions,
  };

  const result: UploadApiResponse = await cloudinary.uploader.upload(
    fileBase64OrUrl,
    defaultOptions
  );

  return {
    url: result.url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

/**
 * Delete an image by its publicId
 */
export async function deleteProductImage(publicId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY ERROR: deleteProductImage must only be called on the server.');
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (error) {
    console.error('Failed to delete image from Cloudinary:', error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Delivery / Transformation URL Builder (Safe for Client & Server)
// -----------------------------------------------------------------------------
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'limit' | 'scale' | 'pad';
  quality?: 'auto' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Generates an optimized, responsive Cloudinary image delivery URL.
 * If given an external URL (e.g. Unsplash during development), returns the original or wraps fetch.
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options: ImageTransformOptions = {}
): string {
  if (!publicIdOrUrl) return '';

  // If already an unsplash or external URL and not Cloudinary, return as is
  if (publicIdOrUrl.startsWith('http') && !publicIdOrUrl.includes('cloudinary.com')) {
    return publicIdOrUrl;
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transforms: string[] = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop && (width || height)) transforms.push(`c_${crop}`);

  const transformString = transforms.join(',');

  // If already a full cloudinary url
  if (publicIdOrUrl.includes('res.cloudinary.com')) {
    const parts = publicIdOrUrl.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformString}/${parts[1]}`;
    }
    return publicIdOrUrl;
  }

  // If just a public ID
  const resolvedCloudName = cloudName || 'demo';
  return `https://res.cloudinary.com/${resolvedCloudName}/image/upload/${transformString}/${publicIdOrUrl}`;
}

export default cloudinary;
