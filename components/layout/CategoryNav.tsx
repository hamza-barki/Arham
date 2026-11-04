'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Layers, Flame } from 'lucide-react';
import { Category } from '@/types';
import { INITIAL_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function CategoryNav() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) {
            setCategories(json.data.filter((c: Category) => !c.parent_id));
          }
        }
      } catch (err) {
        console.error('Failed to load categories in CategoryNav:', err);
      }
    }
    loadCategories();
  }, []);

  // Hide on admin console routes (MUST BE AFTER ALL HOOKS)
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="bg-neutral-50 border-b border-neutral-200/80 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 sm:space-x-4 py-2.5 text-xs font-medium whitespace-nowrap">
          <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-bold mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-800" />
            Explore:
          </span>

          <Link
            href="/"
            className={cn(
              'px-3 py-1.5 rounded-full transition-colors',
              pathname === '/'
                ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60'
            )}
          >
            All Products
          </Link>

          {categories.map((category) => {
            const isActive =
              pathname === `/category/${category.slug}` ||
              pathname === `/categories/${category.slug}`;

            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={cn(
                  'px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5',
                  isActive
                    ? 'bg-emerald-900 text-white font-semibold shadow-xs'
                    : 'text-neutral-700 hover:text-emerald-950 hover:bg-emerald-50'
                )}
              >
                <span>{category.name}</span>
              </Link>
            );
          })}

          <div className="h-4 w-px bg-neutral-300 mx-1 hidden sm:block" />

          <Link
            href="/#new-arrivals"
            className="px-3 py-1.5 text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors flex items-center gap-1 border border-amber-200"
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>New In</span>
          </Link>

          <Link
            href="/#trending"
            className="px-3 py-1.5 text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors flex items-center gap-1 border border-rose-200"
          >
            <Flame className="w-3 h-3 text-rose-600" />
            <span>Trending in Pakistan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
