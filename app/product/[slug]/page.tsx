import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_PRODUCTS, BRAND_NAME } from '@/lib/constants';
import { ProductWithRelations } from '@/types';
import { ProductDetailView } from '@/components/products/ProductDetailView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Helper to fetch product with relations
async function getProduct(slug: string): Promise<ProductWithRelations | null> {
  if (!isSupabaseConfigured()) {
    const found = INITIAL_PRODUCTS.find((p) => p.slug === slug);
    return found || null;
  }

  try {
    const { data, error }: any = await (supabase as any)
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn('Product not found in Supabase, checking fallback:', error?.message);
      const fallback = INITIAL_PRODUCTS.find((p) => p.slug === slug);
      return fallback || null;
    }

    return data as ProductWithRelations;
  } catch (err) {
    console.error('Error fetching product by slug:', err);
    return INITIAL_PRODUCTS.find((p) => p.slug === slug) || null;
  }
}

// Helper to fetch 4 related products
async function getRelatedProducts(
  categoryId: string,
  currentProductId: string
): Promise<ProductWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, 4);
  }

  try {
    const { data }: any = await (supabase as any)
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', currentProductId)
      .limit(4);

    return (data as ProductWithRelations[]) || [];
  } catch {
    return INITIAL_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, 4);
  }
}

// Dynamic SEO Metadata & Open Graph Tags
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: `Product Not Found | ${BRAND_NAME}`,
      description: 'The requested product could not be found.',
    };
  }

  const primaryImage =
    product.images?.[0]?.cloudinary_url ||
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `${product.name} | Buy Online in Pakistan | ${BRAND_NAME}`,
    description:
      product.description?.slice(0, 160) ||
      `Buy ${product.name} online in Pakistan at Rs. ${product.price}. Cash on Delivery (COD) available nationwide with 7-day easy returns.`,
    alternates: {
      canonical: `${baseUrl}/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} - ${BRAND_NAME} Pakistan`,
      description: product.description?.slice(0, 160) || '',
      url: `${baseUrl}/product/${product.slug}`,
      siteName: BRAND_NAME,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 1000,
          alt: product.name,
        },
      ],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category_id, product.id);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.map((i) => i.cloudinary_url) || [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    ],
    description: product.description,
    sku: product.sku,
    url: `${baseUrl}/product/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/product/${product.slug}`,
      priceCurrency: 'PKR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
      },
    },
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </>
  );
}
