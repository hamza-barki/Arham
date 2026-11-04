'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, ArrowUpDown, X, Tag } from 'lucide-react';
import { ProductWithRelations, Category } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';

interface AllProductsViewProps {
  initialProducts: ProductWithRelations[];
  categories: Category[];
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export function AllProductsView({ initialProducts, categories }: AllProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const catSlug = product.category?.slug;
        if (catSlug !== selectedCategory) return false;
      }

      // Price filter
      if (selectedPriceRange === 'under-5000' && product.price >= 5000) return false;
      if (selectedPriceRange === '5000-10000' && (product.price < 5000 || product.price > 10000)) return false;
      if (selectedPriceRange === 'above-10000' && product.price <= 10000) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesDesc = product.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // 'featured' keeps original order
    });
  }, [initialProducts, searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedPriceRange !== 'all' || sortBy !== 'featured';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSortBy('featured');
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <nav className="flex items-center text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">All Products</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
                Complete Collection
              </h1>
              <p className="text-neutral-600 text-sm mt-1 max-w-xl">
                Browse handcrafted Pakistani luxury lawn ensembles, ready-to-wear kurtas, and artisanal full-grain leather bags.
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200/60 px-3.5 py-1.5 rounded-full self-start md:self-auto">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-sm mb-8 space-y-4">
          
          {/* Search and Sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product name, fabric, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all bg-neutral-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort selector */}
            <div className="relative min-w-[200px]">
              <ArrowUpDown className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-10 pr-8 py-2.5 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical: A to Z</option>
              </select>
            </div>
          </div>

          {/* Filter Pills row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
            {/* Categories */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 mr-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Category:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-950 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.slug
                      ? 'bg-emerald-950 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Price ranges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 mr-1">Price:</span>
              <button
                type="button"
                onClick={() => setSelectedPriceRange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPriceRange === 'all'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All Prices
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceRange('under-5000')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPriceRange === 'under-5000'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Under Rs. 5,000
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceRange('5000-10000')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPriceRange === '5000-10000'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Rs. 5k - 10k
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceRange('above-10000')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPriceRange === 'above-10000'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Rs. 10,000+
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium ml-2 underline"
                >
                  Reset all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-neutral-900 text-lg mb-1">
              No matching products found
            </h3>
            <p className="text-neutral-500 text-sm mb-6">
              We couldn&apos;t find any items matching your current filters or search query. Try broadening your criteria.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-900 text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 transition-colors shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
