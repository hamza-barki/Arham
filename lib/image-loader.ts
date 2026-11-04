'use client';

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Cloudinary & Adaptive Image Loader for Next.js Image component.
 * - For Cloudinary images: optimizes with f_auto, q_auto (or specified), w_<width>, c_limit.
 * - For Unsplash / external images: preserves parameters or passes through cleanly.
 * - For local static images: serves standard path.
 */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) return '';

  // 1. Cloudinary hosted image
  if (src.includes('res.cloudinary.com')) {
    const q = quality || 'auto';
    // If it's a full Cloudinary delivery URL with /upload/
    const uploadIndex = src.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const prefix = src.slice(0, uploadIndex + 8);
      const rest = src.slice(uploadIndex + 8);

      // Check if transformations already exist right after /upload/
      // e.g. /upload/v12345/ or /upload/f_auto,.../
      return `${prefix}f_auto,q_${q},w_${width},c_limit/${rest.replace(/^f_auto,q_[^/]+\//, '')}`;
    }
  }

  // 2. Unsplash demo images: append w and q parameters
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', (quality || 80).toString());
    url.searchParams.set('auto', 'format');
    return url.toString();
  }

  // 3. Fallback: return as-is
  return src;
}

