import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, BRAND_NAME } from '@/lib/constants';
import { Category, ProductWithRelations } from '@/types';
import { CategoryPageView } from '@/components/category/CategoryPageView';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

async function getCategoryData(slug: string) {
  if (!isSupabaseConfigured()) {
    const category = INITIAL_CATEGORIES.find((c) => c.slug === slug);
    if (!category) return null;

    const products = INITIAL_PRODUCTS.filter((p) => p.category?.slug === slug);
    const subcategories: Category[] = [];

    return { category, products, subcategories };
  }

  try {
    // 1. Fetch category
    const { data: category, error: catError }: any = await (supabase as any)
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      console.warn('Category not found in Supabase:', catError?.message);
      const fallbackCat = INITIAL_CATEGORIES.find((c) => c.slug === slug);
      if (!fallbackCat) return null;
      return {
        category: fallbackCat,
        products: INITIAL_PRODUCTS.filter((p) => p.category?.slug === slug),
        subcategories: [],
      };
    }

    // 2. Fetch subcategories
    const { data: subcategories }: any = await (supabase as any)
      .from('categories')
      .select('*')
      .eq('parent_id', category.id);

    // 3. Fetch products
    const { data: products }: any = await (supabase as any)
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return {
      category: category as Category,
      products: (products as ProductWithRelations[]) || [],
      subcategories: (subcategories as Category[]) || [],
    };
  } catch (err) {
    console.error('Error fetching category page data:', err);
    const fallbackCat = INITIAL_CATEGORIES.find((c) => c.slug === slug);
    if (!fallbackCat) return null;
    return {
      category: fallbackCat,
      products: INITIAL_PRODUCTS.filter((p) => p.category?.slug === slug),
      subcategories: [],
    };
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const data = await getCategoryData(params.slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!data?.category) {
    return {
      title: `Category Not Found | ${BRAND_NAME}`,
      description: 'The requested category does not exist.',
    };
  }

  return {
    title: `${data.category.name} Collection | Buy Online in Pakistan | ${BRAND_NAME}`,
    description:
      data.category.description ||
      `Explore the latest ${data.category.name} collection in Pakistan. Cash on Delivery nationwide, premium craftsmanship, and easy returns.`,
    alternates: {
      canonical: `${baseUrl}/category/${data.category.slug}`,
    },
    openGraph: {
      title: `${data.category.name} - ${BRAND_NAME} Pakistan`,
      description: data.category.description || '',
      url: `${baseUrl}/category/${data.category.slug}`,
      siteName: BRAND_NAME,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const data = await getCategoryData(params.slug);

  if (!data?.category) {
    notFound();
  }

  return (
    <CategoryPageView
      category={data.category}
      initialProducts={data.products}
      subcategories={data.subcategories}
    />
  );
}
