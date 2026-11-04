'use client';

import React, { useState, useMemo } from 'react';
import { Category, ProductWithRelations } from '@/types';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CategoryFilter, FilterState } from './CategoryFilter';

interface CategoryPageViewProps {
  category: Category;
  initialProducts: ProductWithRelations[];
  subcategories: Category[];
}

export function CategoryPageView({
  category,
  initialProducts,
  subcategories,
}: CategoryPageViewProps) {
  // Extract all available sizes, colors, and maximum price
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      p.variants?.forEach((v) => {
        if (v.size) set.add(v.size);
      });
    });
    return Array.from(set);
  }, [initialProducts]);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      p.variants?.forEach((v) => {
        if (v.color) set.add(v.color);
      });
    });
    return Array.from(set);
  }, [initialProducts]);

  const maxPrice = useMemo(() => {
    return Math.max(...initialProducts.map((p) => p.price), 20000);
  }, [initialProducts]);

  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice,
    sizes: [],
    colors: [],
    sortBy: 'featured',
    inStockOnly: false,
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        // Price filter
        if (product.price < filters.minPrice || product.price > filters.maxPrice) {
          return false;
        }

        // In-stock only filter
        if (filters.inStockOnly && product.stock_quantity <= 0) {
          return false;
        }

        // Size filter
        if (filters.sizes.length > 0) {
          const hasSelectedSize = product.variants?.some(
            (v) => v.size && filters.sizes.includes(v.size)
          );
          if (!hasSelectedSize) return false;
        }

        // Color filter
        if (filters.colors.length > 0) {
          const hasSelectedColor = product.variants?.some(
            (v) => v.color && filters.colors.includes(v.color)
          );
          if (!hasSelectedColor) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price-asc') return a.price - b.price;
        if (filters.sortBy === 'price-desc') return b.price - a.price;
        if (filters.sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0; // featured default
      });
  }, [initialProducts, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Category Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-800">
          Curated Category
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 mt-1 mb-3">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-neutral-600 text-sm leading-relaxed">
            {category.description}
          </p>
        )}

        {/* Subcategories Pills if any */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {subcategories.map((sub) => (
              <span
                key={sub.id}
                className="px-3.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200"
              >
                {sub.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Sort Bar */}
      <CategoryFilter
        filters={filters}
        onFilterChange={setFilters}
        availableSizes={availableSizes}
        availableColors={availableColors}
        maxPossiblePrice={maxPrice}
        totalProductsCount={filteredProducts.length}
      />

      {/* Products Grid */}
      <ProductGrid
        products={filteredProducts}
        emptyMessage={`No products match your selected filters in ${category.name}. Try adjusting your filter parameters.`}
      />
    </div>
  );
}
