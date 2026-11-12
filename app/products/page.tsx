import React from 'react';
import { Metadata } from 'next';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, BRAND_NAME } from '@/lib/constants';
import { ProductWithRelations, Category } from '@/types';
import { AllProductsView } from '@/components/products/AllProductsView';

export const metadata: Metadata = {
  title: `All Products | Luxury Clothes & Artisanal Bags | ${BRAND_NAME}`,
  description:
    'Explore the full catalog of handcrafted luxury pret, unstitched lawn suits, and genuine leather bags across Pakistan. Cash on Delivery available.',
  openGraph: {
    title: `All Products | ${BRAND_NAME}`,
    description: 'Shop luxury Eastern wear and handcrafted leather bags with nationwide COD.',
  },
};

export const revalidate = 60;

async function getCatalogData() {
  if (!isSupabaseConfigured()) {
    return {
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
    };
  }

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      (supabase as any)
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      (supabase as any)
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('display_order', { ascending: true }),
    ]);

    const products: ProductWithRelations[] =
      productsRes.data && productsRes.data.length > 0
        ? productsRes.data
        : INITIAL_PRODUCTS;

    const categories: Category[] =
      categoriesRes.data && categoriesRes.data.length > 0
        ? categoriesRes.data
        : INITIAL_CATEGORIES;

    return { products, categories };
  } catch (error) {
    console.error('Failed to load products from database, falling back:', error);
    return {
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES,
    };
  }
}

export default async function ProductsPage() {
  const { products, categories } = await getCatalogData();

  return <AllProductsView initialProducts={products} categories={categories} />;
}
