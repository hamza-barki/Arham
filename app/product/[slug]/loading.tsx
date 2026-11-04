import React from 'react';

export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 bg-neutral-200 rounded w-48 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery skeleton (7 cols) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-20 md:w-20 md:h-24 bg-neutral-200 rounded-xl" />
            ))}
          </div>
          <div className="flex-1 aspect-[3/4] bg-neutral-200 rounded-2xl" />
        </div>

        {/* Product details skeleton (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="h-4 bg-neutral-200 rounded w-24" />
            <div className="h-8 bg-neutral-200 rounded w-4/5" />
            <div className="h-6 bg-neutral-200 rounded w-32" />
          </div>

          {/* Variants skeleton */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <div className="h-4 bg-neutral-200 rounded w-20" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-10 bg-neutral-200 rounded-xl" />
              ))}
            </div>
          </div>

          {/* CTA Buttons skeleton */}
          <div className="space-y-3 pt-4">
            <div className="h-12 bg-neutral-200 rounded-2xl w-full" />
            <div className="h-12 bg-neutral-200 rounded-2xl w-full" />
          </div>

          {/* Trust badges skeleton */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-neutral-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

