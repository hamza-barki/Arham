import React from 'react';
import Link from 'next/link';
import { PackageX, ArrowRight } from 'lucide-react';
import { ProductWithRelations } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: ProductWithRelations[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = 'No products found in this collection.',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-neutral-50 rounded-3xl border border-dashed border-neutral-300 max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <PackageX className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-neutral-900">No Pieces Found</h3>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">{emptyMessage}</p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <span>View All Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
