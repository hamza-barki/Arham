import { MetadataRoute } from 'next';
import { BRAND_NAME } from '@/lib/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME} - Luxury Clothes & Artisanal Bags Pakistan`,
    short_name: BRAND_NAME,
    description:
      'Handcrafted luxury lawn, pret apparel, and genuine leather bags in Pakistan. Cash on Delivery nationwide.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#064e3b',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

