'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Truck, ShieldCheck, RefreshCw, Phone, Mail, MapPin, ShieldAlert } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';
import { STORE_CONFIG } from '@/lib/config';

export function Footer() {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
      {/* Trust Badges Bar */}
      <div className="border-b border-neutral-800 bg-neutral-950/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Cash on Delivery</h4>
                <p className="text-xs text-neutral-400">Nationwide courier fulfillment across Pakistan</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">7-Day Easy Exchange</h4>
                <p className="text-xs text-neutral-400">Convenient size and defect exchange support</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Quality Checked</h4>
                <p className="text-xs text-neutral-400">Pre-dispatch parcel inspection</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-amber-400 shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Dedicated Customer Support</h4>
                <p className="text-xs text-neutral-400">Mon - Sat: 10:00 AM - 8:00 PM PKT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm ring-1 ring-neutral-700 bg-neutral-950 flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-icon.png"
                  alt={BRAND_NAME}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                {BRAND_NAME}
              </span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed pr-6">
              A bespoke luxury Pakistani brand bringing together artisanal leather bags and exquisite pret & unstitched apparel. Engineered for modern lifestyle, built for durability and timeless elegance.
            </p>
            <div className="pt-2 text-xs text-neutral-400 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Gulberg III, Lahore & Clifton, Karachi, Pakistan</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>contact@arhamcollection.pk</span>
              </div>
            </div>
          </div>

          {/* Clothes Category */}
          <div>
            <h5 className="font-serif font-bold text-white text-sm uppercase tracking-wider mb-4">
              Clothes
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/category/clothes" className="hover:text-amber-400 transition-colors">
                  All Apparel
                </Link>
              </li>
              <li>
                <Link href="/category/clothes?sub=pret-ready-to-wear" className="hover:text-amber-400 transition-colors">
                  Pret & Ready-to-Wear
                </Link>
              </li>
              <li>
                <Link href="/category/clothes?sub=unstitched-lawn" className="hover:text-amber-400 transition-colors">
                  Unstitched Luxury Lawn
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-amber-400 transition-colors">
                  Browse All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Bags Category */}
          <div>
            <h5 className="font-serif font-bold text-white text-sm uppercase tracking-wider mb-4">
              Bags
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/category/bags" className="hover:text-amber-400 transition-colors">
                  All Bags
                </Link>
              </li>
              <li>
                <Link href="/category/bags?sub=tote-bags" className="hover:text-amber-400 transition-colors">
                  Everyday Leather Totes
                </Link>
              </li>
              <li>
                <Link href="/category/bags?sub=crossbody-bags" className="hover:text-amber-400 transition-colors">
                  Quilted Crossbody Bags
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-amber-400 transition-colors">
                  All Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="font-serif font-bold text-white text-sm uppercase tracking-wider mb-4">
              Customer Care
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/orders/track" className="hover:text-amber-400 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-amber-400 transition-colors">
                  Nationwide Shipping & COD
                </Link>
              </li>
              <li>
                <Link href="/exchange-policy" className="hover:text-amber-400 transition-colors">
                  Exchange & Return Policy
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-amber-400 transition-colors">
                  Size Guide (Clothes & Bags)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition-colors">
                  Contact & Store Locations
                </Link>
            </ul>
          </div>
        </div>

        {/* Courier & Payment Partners */}
        <div className="mt-12 pt-8 pb-28 sm:pb-10 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          <div>
            <p className="font-medium text-neutral-300 mb-2 text-center md:text-left">
              Accepted Payment Method:
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1.5 bg-neutral-800 rounded-lg border border-neutral-700 text-emerald-300 font-bold">
                Cash on Delivery (COD) Nationwide
              </span>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1.5">
            <p>© {new Date().getFullYear()} {BRAND_NAME} Pakistan. All rights reserved.</p>
            <div className="flex items-center justify-center md:justify-end gap-3 text-neutral-500">
              <Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
