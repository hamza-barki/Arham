'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPKR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import cloudinaryLoader from '@/lib/image-loader';

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    shippingFee,
    freeShippingRemaining,
    total,
    freeShippingThreshold,
  } = useCart();

  if (!isCartOpen) return null;

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform ease-out duration-300 animate-in slide-in-from-right">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-800" />
              <h2 className="font-serif text-lg font-bold text-neutral-900">
                Shopping Bag ({items.length})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 -mr-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Close Shopping Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pakistan Free Shipping Progress Meter */}
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium mb-1.5">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              {freeShippingRemaining > 0 ? (
                <span>
                  Add <strong className="text-emerald-900">{formatPKR(freeShippingRemaining)}</strong> more for <strong>FREE Nationwide Delivery</strong>
                </span>
              ) : (
                <span className="text-emerald-800 font-semibold">
                  🎉 Congratulations! You have unlocked FREE Nationwide Delivery!
                </span>
              )}
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-700 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-neutral-900 mb-1">
                  Your bag is empty
                </h3>
                <p className="text-sm text-neutral-500 max-w-xs mb-6">
                  Explore our luxury Lawn, Pret clothes, and handcrafted Leather bags.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <Link href="/categories/clothes" onClick={closeCart}>
                    <Button variant="primary" className="w-full">
                      Explore Clothes
                    </Button>
                  </Link>
                  <Link href="/categories/bags" onClick={closeCart}>
                    <Button variant="outline" className="w-full">
                      Explore Bags
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      loader={cloudinaryLoader}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="font-medium text-sm text-neutral-900 hover:text-emerald-900 line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1 -mr-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                        {item.size && <span>Size: <strong>{item.size}</strong></span>}
                        {item.size && item.color && <span>•</span>}
                        {item.color && <span>Color: <strong>{item.color}</strong></span>}
                      </div>

                      <div className="mt-1 font-semibold text-sm text-neutral-900">
                        {formatPKR(item.price)}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-neutral-200 rounded-md">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-neutral-100 text-neutral-600 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 hover:bg-neutral-100 text-neutral-600 disabled:opacity-30 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        Subtotal: {formatPKR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="border-t border-neutral-200 px-6 py-5 bg-neutral-50 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery (Across Pakistan)</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-semibold uppercase text-xs">FREE</span>
                    ) : (
                      formatPKR(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Estimated Total</span>
                  <span className="text-emerald-950 font-serif text-lg">{formatPKR(total)}</span>
                </div>
              </div>

              <div className="text-[11px] text-center text-neutral-500 bg-white p-2 rounded-lg border border-neutral-200 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <strong>Cash on Delivery (COD)</strong> available at checkout
              </div>

              <Link href="/cart" onClick={closeCart} className="block">
                <Button variant="primary" size="lg" className="w-full gap-2">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
