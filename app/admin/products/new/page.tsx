import React from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export const metadata = {
  title: 'Add New Product | Admin Portal',
};

export default function NewProductPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
        <span className="text-xs text-neutral-400">Step 1 of 1</span>
      </div>

      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-emerald-800" />
          Add New Product
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Configure product listing, Markaz wholesale cost, live margin simulator, Cloudinary photos, and size/color variants.
        </p>
      </div>

      <ProductForm isEdit={false} />
    </div>
  );
}

