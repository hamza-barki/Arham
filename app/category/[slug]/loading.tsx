import React from 'react';
import { ProductGridSkeleton } from '@/components/products/LoadingSkeleton';

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-shimmer">
      {/* Category banner skeleton */}
      <div className="h-40 sm:h-56 bg-neutral-200 rounded-3xl mb-8 w-full" />

      {/* Filter and sorting bar skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-5 bg-neutral-200 rounded w-32" />
        <div className="h-10 bg-neutral-200 rounded-xl w-36" />
      </div>

      {/* Products Grid skeleton */}
      <ProductGridSkeleton count={8} />
    </div>
  );
}

