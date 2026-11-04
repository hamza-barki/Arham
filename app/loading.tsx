import React from 'react';
import { ProductGridSkeleton } from '@/components/products/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      {/* Header skeleton */}
      <div className="max-w-md mx-auto text-center mb-10 space-y-3">
        <div className="h-4 bg-neutral-200 rounded-full w-28 mx-auto" />
        <div className="h-8 bg-neutral-200 rounded-xl w-3/4 mx-auto" />
        <div className="h-4 bg-neutral-200 rounded-full w-full" />
      </div>

      {/* Grid skeleton */}
      <ProductGridSkeleton count={8} />
    </div>
  );
}
