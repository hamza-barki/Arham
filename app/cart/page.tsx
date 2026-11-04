'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { formatPKR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import cloudinaryLoader from '@/lib/image-loader';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    shippingFee,
    freeShippingRemaining,
    total,
    freeShippingThreshold,
  } = useCart();

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-neutral-900 mb-3">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-neutral-600 max-w-md mx-auto mb-8 text-sm">
          Discover our latest Eastern pret wear, embroidered luxury lawn, and artisanal leather totes crafted in Pakistan.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/category/clothes">
            <Button variant="primary" size="lg">
              Explore Clothes
            </Button>
          </Link>
          <Link href="/category/bags">
            <Button variant="outline" size="lg">
              Explore Bags
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Review your selected items before proceeding to nationwide Cash on Delivery checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Shipping Bar */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-950 font-medium mb-2">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              {freeShippingRemaining > 0 ? (
                <span>
                  Add <strong className="text-emerald-900 font-bold">{formatPKR(freeShippingRemaining)}</strong> more to get <strong>FREE Nationwide Delivery</strong>!
                </span>
              ) : (
                <span className="text-emerald-800 font-semibold">
                  🎉 You qualify for <strong>FREE Nationwide Delivery</strong> across Pakistan!
                </span>
              )}
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-700 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Table / List */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 divide-y divide-neutral-100 overflow-hidden shadow-xs">
            {items.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Image */}
                <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    loader={cloudinaryLoader}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-semibold text-neutral-900 hover:text-emerald-900 text-sm sm:text-base line-clamp-1 transition-colors"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-neutral-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-500">
                    SKU: {item.sku}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-neutral-600 pt-1">
                    {item.size && (
                      <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 font-medium">
                        Size: {item.size}
                      </span>
                    )}
                    {item.color && (
                      <span className="bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 font-medium">
                        Color: {item.color}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="font-bold text-neutral-900 text-sm sm:text-base">
                      {formatPKR(item.price)}
                    </span>
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatPKR(item.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-neutral-200/60 text-neutral-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-neutral-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 hover:bg-neutral-200/60 text-neutral-700 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-neutral-400 block sm:hidden">Item total:</span>
                    <span className="font-bold text-neutral-900 text-sm sm:text-base">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-6">
            <h2 className="font-serif text-lg font-bold text-neutral-900 pb-3 border-b border-neutral-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatPKR(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Nationwide Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    formatPKR(shippingFee)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-neutral-900 text-base">Grand Total</span>
                  <p className="text-[11px] text-neutral-400">Includes all taxes and duties</p>
                </div>
                <span className="font-serif text-2xl font-bold text-emerald-950">
                  {formatPKR(total)}
                </span>
              </div>
            </div>

            {/* COD Callout */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-2.5 text-xs text-neutral-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
              <span>
                <strong>Cash on Delivery (COD)</strong> available. Pay cash to courier upon receiving your package.
              </span>
            </div>

            <Link href="/checkout" className="block">
              <Button variant="primary" size="lg" className="w-full gap-2">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            {/* Trust Assurances */}
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Delivery in 2-3 working days across Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-700" />
                <span>7-Day Hassle-free Size & Style Exchange</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>100% Original Products Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
