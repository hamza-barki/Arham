'use client';

import React from 'react';
import { ProductVariant } from '@/types';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelectVariant,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  // Extract unique sizes and colors
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];

  const handleSizeClick = (size: string) => {
    // Find variant matching current color + this size, or first variant with this size
    const match =
      variants.find((v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color)) ||
      variants.find((v) => v.size === size);
    if (match) onSelectVariant(match);
  };

  const handleColorClick = (color: string) => {
    // Find variant matching current size + this color, or first variant with this color
    const match =
      variants.find((v) => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size)) ||
      variants.find((v) => v.color === color);
    if (match) onSelectVariant(match);
  };

  return (
    <div className="space-y-4">
      {/* Sizes */}
      {sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-sm font-medium text-neutral-900 mb-2">
            <span>Size: <strong className="text-emerald-900">{selectedVariant?.size || 'Select'}</strong></span>
            <span className="text-xs text-neutral-500 cursor-pointer hover:underline">Size Chart</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isSelected = selectedVariant?.size === size;
              const hasStock = variants.some((v) => v.size === size && v.stock_quantity > 0);

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleSizeClick(size)}
                  disabled={!hasStock}
                  className={cn(
                    'px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200',
                    isSelected
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400',
                    !hasStock && 'opacity-40 line-through cursor-not-allowed bg-neutral-100'
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
      {colors.length > 0 && (
        <div>
          <div className="text-sm font-medium text-neutral-900 mb-2">
            Color: <strong className="text-emerald-900">{selectedVariant?.color || 'Select'}</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const isSelected = selectedVariant?.color === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorClick(color)}
                  className={cn(
                    'px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all duration-200',
                    isSelected
                      ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-800/20'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
