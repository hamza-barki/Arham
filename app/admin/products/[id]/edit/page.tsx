'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Loader2, AlertCircle } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { getAdminProductDetailAction, AdminProductFormInput } from '@/app/actions/admin-products';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<AdminProductFormInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminProductDetailAction(productId);
        if (res.success && res.product) {
          setProduct(res.product);
        } else {
          setError(res.error || 'Product not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

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
        {product?.slug && (
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="text-xs text-emerald-800 font-semibold hover:underline"
          >
            View Live Listing &rarr;
          </Link>
        )}
      </div>

      <div className="border-b border-neutral-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-emerald-800" />
          Edit Product
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Update prices, wholesale supplier costs, stock quantities, and Cloudinary image galleries.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-800 mb-3" />
          <p className="text-sm font-bold text-neutral-700">Loading product details...</p>
        </div>
      ) : error || !product ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <div className="text-base font-bold text-rose-900">Failed to load product</div>
          <p className="text-xs text-rose-700 max-w-sm mx-auto">{error || 'Unknown error occurred'}</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold"
          >
            Return to Products Catalog
          </button>
        </div>
      ) : (
        <ProductForm initialData={product} isEdit={true} />
      )}
    </div>
  );
}

