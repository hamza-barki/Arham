'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { ProductWithRelations } from '@/types';
import { formatPKR } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/hooks/useCart';
import cloudinaryLoader from '@/lib/image-loader';

interface ProductCardProps {
  product: ProductWithRelations;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const mainImage = product.images?.[0]?.cloudinary_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Default to first variant if exists
    const defaultVariant = product.variants?.[0];

    addItem({
      productId: product.id,
      variantId: defaultVariant?.id || null,
      sku: defaultVariant ? `${product.sku}-${defaultVariant.sku_suffix}` : product.sku,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compare_at_price,
      size: defaultVariant?.size || null,
      color: defaultVariant?.color || null,
      image: mainImage,
      quantity: 1,
      maxStock: defaultVariant?.stock_quantity || product.stock_quantity,
    });
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300">
      
      {/* Image Container with Hover Effect */}
      <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          unoptimized={mainImage.startsWith('data:')}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loader={cloudinaryLoader}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="danger" className="font-bold text-[11px] shadow-sm">
              -{discountPercent}% OFF
            </Badge>
          </div>
        )}

        {/* Stock Badge */}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="warning" className="font-semibold text-[10px]">
              Only {product.stock_quantity} left
            </Badge>
          </div>
        )}

        {/* Floating Quick Action Overlay */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <button
            onClick={handleQuickAdd}
            type="button"
            className="flex-1 bg-white/95 backdrop-blur-md hover:bg-emerald-900 hover:text-white text-neutral-900 text-xs font-semibold py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Quick Add
          </button>
        </div>
      </Link>

      {/* Details Container */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category Tag */}
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="uppercase tracking-wider font-medium text-[11px] text-emerald-800">
              {product.category?.name || 'Collection'}
            </span>
          </div>

          {/* Product Name */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-medium text-neutral-900 group-hover:text-emerald-900 text-sm line-clamp-1 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-bold text-neutral-900 text-base">
            {formatPKR(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-neutral-400 line-through">
              {formatPKR(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
