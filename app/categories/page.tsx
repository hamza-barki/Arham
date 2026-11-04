import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_CATEGORIES, BRAND_NAME } from '@/lib/constants';
import { Category } from '@/types';
import cloudinaryLoader from '@/lib/image-loader';

export const metadata: Metadata = {
  title: `Collections & Categories | ${BRAND_NAME}`,
  description:
    'Discover our signature Pakistani fashion collections: Luxury Pret, Unstitched Embroidered Lawn, Everyday Leather Totes, and Crossbody Bags.',
};

interface CategoryWithChildren extends Category {
  children?: Category[];
}

async function getCategories(): Promise<CategoryWithChildren[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        ...INITIAL_CATEGORIES[0],
        children: [
          {
            id: 'c1-sub1',
            name: 'Pret & Ready-to-Wear',
            slug: 'pret-ready-to-wear',
            parent_id: INITIAL_CATEGORIES[0].id,
            description: 'Stitched single and two-piece kurtas.',
            image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
            display_order: 1,
            created_at: new Date().toISOString(),
          },
          {
            id: 'c1-sub2',
            name: 'Unstitched Luxury Lawn',
            slug: 'unstitched-lawn',
            parent_id: INITIAL_CATEGORIES[0].id,
            description: '3-Piece embroidered luxury lawn ensembles.',
            image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
            display_order: 2,
            created_at: new Date().toISOString(),
          },
        ],
      },
      {
        ...INITIAL_CATEGORIES[1],
        children: [
          {
            id: 'c2-sub1',
            name: 'Everyday Leather Totes',
            slug: 'tote-bags',
            parent_id: INITIAL_CATEGORIES[1].id,
            description: 'Spacious work & travel laptop totes.',
            image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
            display_order: 1,
            created_at: new Date().toISOString(),
          },
          {
            id: 'c2-sub2',
            name: 'Quilted Crossbody Bags',
            slug: 'crossbody-bags',
            parent_id: INITIAL_CATEGORIES[1].id,
            description: 'Compact weekend and evening crossbodies.',
            image_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80',
            display_order: 2,
            created_at: new Date().toISOString(),
          },
        ],
      },
    ];
  }

  try {
    const { data: allCategories } = await (supabase as any)
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!allCategories || allCategories.length === 0) {
      return INITIAL_CATEGORIES;
    }

    const parents = allCategories.filter((c: Category) => !c.parent_id);
    return parents.map((parent: Category) => ({
      ...parent,
      children: allCategories.filter((c: Category) => c.parent_id === parent.id),
    }));
  } catch (error) {
    console.error('Failed to load categories:', error);
    return INITIAL_CATEGORIES;
  }
}

export default async function CategoriesIndexPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <nav className="flex items-center justify-center text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Categories</span>
          </nav>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Curated Collections
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-950 tracking-tight">
            Our Signatures
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mt-3 leading-relaxed">
            Each collection is thoughtfully designed with premium fabrics and artisanal leatherwork to elevate your everyday luxury.
          </p>
        </div>

        {/* Primary Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Category Hero Banner */}
              <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] overflow-hidden bg-neutral-100">
                <Image
                  src={cat.image_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80'}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loader={cloudinaryLoader}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-1 block">
                    Collection
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-1">
                    {cat.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-md">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Subcategories & Link */}
              <div className="p-6 bg-white flex flex-col justify-between flex-1">
                {cat.children && cat.children.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                      Sub-Collections
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${cat.slug}?sub=${sub.slug}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:border-emerald-900/30 hover:bg-emerald-50/40 transition-all text-xs group/sub"
                        >
                          <span className="font-medium text-neutral-800 group-hover/sub:text-emerald-950">
                            {sub.name}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover/sub:text-emerald-950 group-hover/sub:translate-x-0.5 transition-transform" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <Link
                    href={`/category/${cat.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-950 hover:text-emerald-800 transition-colors"
                  >
                    View All {cat.name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/category/${cat.slug}`}
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-emerald-950 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Products CTA */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-neutral-900 text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-xl">
          <Layers className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">
            Looking for something specific?
          </h2>
          <p className="text-neutral-300 text-sm max-w-lg mx-auto mb-6">
            Search our entire catalog of clothes and leather goods with real-time price and size filters.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded-xl text-sm transition-colors shadow-lg"
          >
            Browse All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
