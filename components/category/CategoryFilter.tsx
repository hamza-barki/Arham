'use client';

import React from 'react';
import { SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  sizes: string[];
  colors: string[];
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'newest';
  inStockOnly: boolean;
}

interface CategoryFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableSizes: string[];
  availableColors: string[];
  maxPossiblePrice: number;
  totalProductsCount: number;
}

export function CategoryFilter({
  filters,
  onFilterChange,
  availableSizes,
  availableColors,
  maxPossiblePrice = 25000,
  totalProductsCount,
}: CategoryFilterProps) {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as FilterState['sortBy'],
    });
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: newSizes });
  };

  const handleColorToggle = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFilterChange({ ...filters, colors: newColors });
  };

  const handleReset = () => {
    onFilterChange({
      minPrice: 0,
      maxPrice: maxPossiblePrice,
      sizes: [],
      colors: [],
      sortBy: 'featured',
      inStockOnly: false,
    });
  };

  const hasActiveFilters =
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < maxPossiblePrice ||
    filters.inStockOnly;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 mb-8 shadow-xs">
      {/* Top Bar: Results Count + Sort + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
          <span className="font-semibold text-sm text-neutral-900">Filters & Sort</span>
          <span className="text-xs text-neutral-500">
            ({totalProductsCount} {totalProductsCount === 1 ? 'item' : 'items'})
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="ml-2 text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-neutral-600 font-medium">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={filters.sortBy}
            onChange={handleSortChange}
            aria-label="Sort products by"
            className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="featured">Featured Collection</option>
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
        {/* Sizes */}
        {availableSizes.length > 0 && (
          <div>
            <span className="font-semibold text-neutral-900 block mb-2">Filter by Size</span>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((size) => {
                const isSelected = filters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={cn(
                      'px-2.5 py-1 rounded-md border font-medium transition-colors',
                      isSelected
                        ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Colors */}
        {availableColors.length > 0 && (
          <div>
            <span className="font-semibold text-neutral-900 block mb-2">Filter by Color</span>
            <div className="flex flex-wrap gap-1.5">
              {availableColors.map((color) => {
                const isSelected = filters.colors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorToggle(color)}
                    className={cn(
                      'px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors flex items-center gap-1',
                      isSelected
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-800'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                    )}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-emerald-800" />}
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price & Stock Toggles */}
        <div className="space-y-3">
          <div>
            <span className="font-semibold text-neutral-900 block mb-1">
              Max Price: <strong>Rs. {filters.maxPrice.toLocaleString()}</strong>
            </span>
            <input
              type="range"
              min={1000}
              max={maxPossiblePrice}
              step={500}
              value={filters.maxPrice}
              onChange={(e) =>
                onFilterChange({ ...filters, maxPrice: Number(e.target.value) })
              }
              aria-label="Filter by maximum price in rupees"
              className="w-full accent-emerald-800 cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) =>
                onFilterChange({ ...filters, inStockOnly: e.target.checked })
              }
              className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4"
            />
            <span>Show In-Stock items only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
