import React from 'react';
import { ProductGridSkeleton } from '@/components/products/LoadingSkeleton';
import { LuxuryLoader } from '@/components/ui/LuxuryLoader';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Luxury Brand Header Loader */}
      <LuxuryLoader
        message="Loading Collection..."
        subMessage="Handcrafted Luxury Lawn & Leatherware"
      />

      {/* Grid skeleton with shimmer */}
      <div className="mt-8 animate-shimmer">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
