import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-[3/4] bg-neutral-200/80 w-full" />
      
      {/* Details Skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-neutral-200 rounded w-1/4" />
          <div className="h-2 bg-neutral-200 rounded w-1/6" />
        </div>
        <div className="h-4 bg-neutral-200 rounded w-4/5" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="pt-2 flex justify-between items-center">
          <div className="h-5 bg-neutral-200 rounded w-1/3" />
          <div className="h-8 bg-neutral-200 rounded-lg w-20" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-[3/4] bg-neutral-200 rounded-2xl w-full" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-200 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Info Skeleton */}
        <div className="space-y-6">
          <div className="h-4 bg-neutral-200 rounded w-1/4" />
          <div className="h-8 bg-neutral-200 rounded w-3/4" />
          <div className="h-6 bg-neutral-200 rounded w-1/3" />
          <div className="h-24 bg-neutral-200 rounded-xl w-full" />
          <div className="h-10 bg-neutral-200 rounded-lg w-1/2" />
          <div className="h-14 bg-neutral-200 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
