import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_PRODUCTS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('category');

  // If Supabase is not configured yet with valid credentials, return seed items gracefully
  if (!isSupabaseConfigured()) {
    let filtered = INITIAL_PRODUCTS;
    if (categorySlug) {
      filtered = filtered.filter((p) => p.category?.slug === categorySlug);
    }
    return NextResponse.json({
      data: filtered,
      source: 'seed_fallback',
      message: 'Supabase credentials not yet configured. Returning initial seed products.',
    });
  }

  try {
    // Explicit column lists — never select('*')
    let query: any = (supabase as any)
      .from('products')
      .select(`
        id,
        sku,
        name,
        slug,
        description,
        price,
        compare_at_price,
        stock_quantity,
        is_active,
        created_at,
        category_id,
        category:categories (
          id,
          name,
          slug,
          parent_id,
          display_order
        ),
        variants:product_variants (
          id,
          product_id,
          size,
          color,
          stock_quantity,
          sku_suffix
        ),
        images:product_images (
          id,
          product_id,
          cloudinary_url,
          cloudinary_public_id,
          position,
          is_size_chart
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (categorySlug) {
      const { data: catData }: any = await (supabase as any)
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (catData?.id) {
        query = query.eq('category_id', catData.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase products fetch error:', error);
      return NextResponse.json(
        { data: INITIAL_PRODUCTS, error: error.message, source: 'fallback_on_error' },
        { status: 200 }
      );
    }

    return NextResponse.json({ data, source: 'supabase' });
  } catch (err: any) {
    console.error('API products error:', err);
    return NextResponse.json(
      { data: INITIAL_PRODUCTS, error: err.message, source: 'fallback_on_error' },
      { status: 200 }
    );
  }
}

