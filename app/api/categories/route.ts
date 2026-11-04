import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_CATEGORIES } from '@/lib/constants';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      data: INITIAL_CATEGORIES,
      source: 'seed_fallback',
    });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Supabase categories fetch error:', error);
      return NextResponse.json({ data: INITIAL_CATEGORIES, error: error.message });
    }

    return NextResponse.json({ data, source: 'supabase' });
  } catch (err: any) {
    return NextResponse.json({ data: INITIAL_CATEGORIES, error: err.message });
  }
}
