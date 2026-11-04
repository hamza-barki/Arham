import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/account/',
        '/checkout',
        '/cart',
        '/order-confirmation/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
