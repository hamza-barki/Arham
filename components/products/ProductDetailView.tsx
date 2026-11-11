'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProductWithRelations, ProductVariant } from '@/types';
import { formatPKR } from '@/lib/utils';
import { ImageGallery } from './ImageGallery';
import { SizeChartModal } from './SizeChartModal';
import { ProductCard } from './ProductCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import {
  Truck,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
  ShoppingBag,
  Ruler,
  PhoneCall,
  Check,
} from 'lucide-react';

interface ProductDetailViewProps {
  product: ProductWithRelations;
  relatedProducts: ProductWithRelations[];
}

const COLOR_HEX_MAP: Record<string, string> = {
  pink: '#ec4899',
  rose: '#f43f5e',
  orange: '#f97316',
  red: '#ef4444',
  maroon: '#800000',
  burgundy: '#800020',
  yellow: '#eab308',
  mustard: '#d97706',
  green: '#22c55e',
  emerald: '#059669',
  olive: '#556b2f',
  teal: '#14b8a6',
  blue: '#3b82f6',
  navy: '#1e3a8a',
  ferozi: '#06b6d4',
  cyan: '#06b6d4',
  purple: '#a855f7',
  plum: '#701a75',
  violet: '#7c3aed',
  black: '#171717',
  white: '#f9fafb',
  grey: '#9ca3af',
  gray: '#9ca3af',
  brown: '#78350f',
  beige: '#f5f5dc',
  gold: '#d4af37',
  skin: '#e7bc91',
  peach: '#ffdab9',
  rust: '#b7410e',
};

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const { addItem } = useCart();
  
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.find((v) => v.stock_quantity > 0) || variants[0] || null
  );

  const [quantity, setQuantity] = useState(1);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  // Check if an image is marked as a size chart
  const sizeChartImage = product.images?.find((img) => img.is_size_chart)?.cloudinary_url || null;

  // Active stock calculation
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const isOutOfStock = currentStock <= 0;

  // Pricing & Discounts
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  // Extract unique sizes and colors
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];

  // Variant change handlers with out-of-stock disabling logic
  const handleSelectSize = (size: string) => {
    // If currently selected color exists, prioritize same color with this size
    const matching =
      variants.find((v) => v.size === size && v.color === selectedVariant?.color) ||
      variants.find((v) => v.size === size && v.stock_quantity > 0) ||
      variants.find((v) => v.size === size);

    if (matching) {
      setSelectedVariant(matching);
      setQuantity(1);
    }
  };

  const handleSelectColor = (color: string) => {
    const matching =
      variants.find((v) => v.color === color && v.size === selectedVariant?.size) ||
      variants.find((v) => v.color === color && v.stock_quantity > 0) ||
      variants.find((v) => v.color === color);

    if (matching) {
      setSelectedVariant(matching);
      setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const mainImg = product.images?.find((img) => !img.is_size_chart)?.cloudinary_url ||
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      sku: selectedVariant ? `${product.sku}-${selectedVariant.sku_suffix}` : product.sku,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compare_at_price,
      size: selectedVariant?.size || null,
      color: selectedVariant?.color || null,
      image: mainImg,
      quantity,
      maxStock: currentStock,
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-neutral-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/category/${product.category?.slug || 'clothes'}`}
          className="hover:text-neutral-900 transition-colors"
        >
          {product.category?.name || 'Category'}
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left: Image Gallery (7 cols) */}
        <div className="lg:col-span-7">
          <ImageGallery
            images={product.images || []}
            productName={product.name}
            hasSizeChart={Boolean(sizeChartImage || sizes.length > 0)}
            onOpenSizeChart={() => setIsSizeChartOpen(true)}
          />
        </div>

        {/* Right: Product Details & Purchase Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span className="uppercase tracking-widest font-semibold text-emerald-800">
                {product.category?.name}
              </span>
              <span className="font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
              {product.name}
            </h1>

            {/* Price & Discount */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
                {formatPKR(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-neutral-400 line-through">
                    {formatPKR(product.compare_at_price!)}
                  </span>
                  <Badge variant="danger" className="text-xs font-bold">
                    Save {discountPercent}%
                  </Badge>
                </>
              )}
            </div>

            {/* Pakistan COD Badge */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Cash on Delivery (COD) Eligible Across Pakistan 🇵🇰
            </div>
          </div>

          <hr className="border-neutral-200/80" />

          {/* Description */}
          <div className="text-sm text-neutral-600 leading-relaxed">
            <p>{product.description}</p>
          </div>

          {/* Variant Selection: Sizes */}
          {sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-900 mb-2">
                <span>Select Size: <strong className="text-emerald-900">{selectedVariant?.size || 'Select'}</strong></span>
                <button
                  type="button"
                  onClick={() => setIsSizeChartOpen(true)}
                  className="text-emerald-800 hover:text-emerald-950 flex items-center gap-1 font-semibold"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  View Size Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const isSelected = selectedVariant?.size === size;
                  // Check stock for this size in current color
                  const variantForSize = variants.find(
                    (v) => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color)
                  ) || variants.find((v) => v.size === size);

                  const hasStock = variantForSize ? variantForSize.stock_quantity > 0 : false;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!hasStock}
                      onClick={() => handleSelectSize(size)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                      } ${!hasStock ? 'opacity-35 line-through cursor-not-allowed bg-neutral-100' : ''}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant Selection: Colors */}
          {colors.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-neutral-900 mb-2">
                Select Color: <strong className="text-emerald-900">{selectedVariant?.color || 'Select'}</strong>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const isSelected = selectedVariant?.color === color;
                  const variantForColor = variants.find(
                    (v) => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size)
                  ) || variants.find((v) => v.color === color);

                  const hasStock = variantForColor ? variantForColor.stock_quantity > 0 : false;

                  const colorHex = COLOR_HEX_MAP[color.toLowerCase().trim()];

                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={!hasStock}
                      onClick={() => handleSelectColor(color)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20 shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                      } ${!hasStock ? 'opacity-35 line-through cursor-not-allowed' : ''}`}
                    >
                      {colorHex && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-2xs shrink-0"
                          style={{ backgroundColor: colorHex }}
                        />
                      )}
                      {isSelected && <Check className="w-3 h-3 text-emerald-800" />}
                      <span>{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-neutral-300 rounded-xl bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-3 text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-bold text-sm text-neutral-900 min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="p-3 text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <Button
                variant="primary"
                size="lg"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 py-3.5 text-base font-bold shadow-lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Currently Out of Stock' : `Add to Cart • ${formatPKR(product.price * quantity)}`}
              </Button>
            </div>

            {/* Low stock alert */}
            {currentStock <= 5 && currentStock > 0 && (
              <p className="text-xs text-amber-700 font-semibold animate-pulse">
                ⚡ Only {currentStock} left in stock for this variant! Order now.
              </p>
            )}

            {addedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between animate-in fade-in duration-200">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700" />
                  Added to your Shopping Bag!
                </span>
                <Link href="/cart" className="underline font-bold hover:text-emerald-950">
                  View Bag →
                </Link>
              </div>
            )}
          </div>

          {/* Pakistani Market Trust Section */}
          <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3.5 text-xs text-neutral-700">
            <div className="flex items-start gap-3">
              <Truck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 block">Nationwide Cash on Delivery:</strong>
                <span>Karachi, Lahore & Islamabad within 2-3 working days. Other cities within 3-5 days.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RefreshCw className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 block">7-Day Easy Exchange Policy:</strong>
                <span>Hassle-free size and product exchanges if the fit isn&apos;t perfect.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900 block">100% Quality Guaranteed:</strong>
                <span>Hand-inspected before dispatch from our Pakistani fulfillment center.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px] text-neutral-500">
              <span>Need help ordering?</span>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923000000000'}?text=Assalam%20o%20Alaikum,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 font-bold hover:underline flex items-center gap-1"
              >
                <PhoneCall className="w-3 h-3 text-emerald-700" />
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* "You May Also Like" Related Products Section (4 products) */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Curated For You
              </span>
              <h2 className="font-serif text-2xl font-bold text-neutral-900 mt-0.5">
                You May Also Like
              </h2>
            </div>
            <Link
              href={`/category/${product.category?.slug || 'clothes'}`}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
            >
              View More in {product.category?.name} →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.slice(0, 4).map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        sizeChartImageUrl={sizeChartImage}
        categorySlug={product.category?.slug}
      />
    </div>
  );
}
