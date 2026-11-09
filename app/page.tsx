import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_PRODUCTS } from '@/lib/constants';
import { ProductWithRelations } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/Button';
import cloudinaryLoader from '@/lib/image-loader';
import {
  Truck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTrendingProducts(): Promise<ProductWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_PRODUCTS;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error || !data || data.length === 0) {
      return INITIAL_PRODUCTS;
    }

    return data as ProductWithRelations[];
  } catch (err) {
    console.error('Error fetching trending products for homepage:', err);
    return INITIAL_PRODUCTS;
  }
}

export default async function HomePage() {
  const trendingProducts = await getTrendingProducts();

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. Hero Banner Section */}
      <section className="relative bg-neutral-900 text-white overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-emerald-950/70 z-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Background Image (LCP Hero) */}
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80"
            alt="Luxury Fashion Pakistan - Arham Collection"
            fill
            priority
            sizes="100vw"
            loader={cloudinaryLoader}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40">
          <div className="max-w-2xl space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-900/80 text-amber-300 border border-emerald-700/60 backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Festive 2026 Collection • Cash on Delivery Across Pakistan</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
              Timeless Elegance, <br />
              <span className="italic font-normal text-amber-200">Handcrafted</span> for Pakistan.
            </h1>

            {/* Subtext */}
            <p className="text-neutral-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl">
              Immerse yourself in artisanal leather bags, tailored pret silhouettes, and pure embroidered lawn. Designed for distinction, delivered nationwide.
            </p>

            {/* Call to Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link href="/category/clothes">
                <Button variant="accent" size="lg" className="font-bold shadow-lg gap-2 text-white bg-amber-600 hover:bg-amber-700">
                  Shop Clothes
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/category/bags">
                <Button variant="outline" size="lg" className="font-bold text-white border-white/70 hover:bg-white/10">
                  Explore Bags
                </Button>
              </Link>
            </div>

            {/* Micro Trust Counters */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-bold text-white text-base sm:text-lg block">Nationwide</span>
                <span className="text-neutral-400">Cash on Delivery</span>
              </div>
              <div>
                <span className="font-bold text-white text-base sm:text-lg block">Curated</span>
                <span className="text-neutral-400">Premium Fabrics & Bags</span>
              </div>
              <div>
                <span className="font-bold text-white text-base sm:text-lg block">7 Days</span>
                <span className="text-neutral-400">Easy Nationwide Exchange</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Badges Section */}
      <section className="bg-emerald-950 text-white py-6 border-y border-emerald-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Truck className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold">Cash on Delivery</h4>
                <p className="text-[11px] text-emerald-200">Across All Pakistan Cities</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold">Free Shipping</h4>
                <p className="text-[11px] text-emerald-200">On all orders above Rs. 3,000</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <RefreshCw className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold">7-Day Easy Returns</h4>
                <p className="text-[11px] text-emerald-200">Hassle-free size exchanges</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold">Secure Packaging</h4>
                <p className="text-[11px] text-emerald-200">Pre-dispatch parcel check</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories Grid (Clothes & Bags) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Curated Collections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 mt-1">
            Shop by Category
          </h2>
          <p className="text-neutral-500 text-sm mt-2">
            Explore our signature collections tailored to elevate your wardrobe with authentic Pakistani design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Category 1: Clothes */}
          <Link
            href="/category/clothes"
            className="group relative min-h-[280px] sm:min-h-[340px] rounded-3xl overflow-hidden shadow-lg border border-neutral-200 flex flex-col justify-end p-6 sm:p-8"
          >
            <Image
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80"
              alt="Clothes Collection - Arham Collection"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              loader={cloudinaryLoader}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-end justify-between gap-4 text-white">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest block">
                  Pret & Unstitched Lawn
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                  Clothes Collection
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-sm line-clamp-2">
                  Embroidered kurtas, 3-piece formals, and stitched Pakistani elegance.
                </p>
              </div>
              <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-amber-600 transition-colors shrink-0">
                <ArrowRight className="w-5 h-5 text-white" />
              </span>
            </div>
          </Link>

          {/* Category 2: Bags */}
          <Link
            href="/category/bags"
            className="group relative min-h-[280px] sm:min-h-[340px] rounded-3xl overflow-hidden shadow-lg border border-neutral-200 flex flex-col justify-end p-6 sm:p-8"
          >
            <Image
              src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80"
              alt="Bags Collection - Arham Collection"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              loader={cloudinaryLoader}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-end justify-between gap-4 text-white">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest block">
                  Signature Leather Goods
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                  Bags Collection
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-sm line-clamp-2">
                  Everyday work totes, crossbody silhouettes, and luxury evening clutches.
                </p>
              </div>
              <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-amber-600 transition-colors shrink-0">
                <ArrowRight className="w-5 h-5 text-white" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Featured Products Section (Real data from Supabase) */}
      <section id="trending" className="bg-neutral-50/80 py-16 sm:py-24 border-y border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Featured Collection
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-neutral-900 mt-1">
                Popular in Pakistan
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Handpicked customer favorites available with nationwide Cash on Delivery.
              </p>
            </div>

            <Link
              href="/category/clothes"
              className="text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              View Full Collection →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Store Operations & Fulfillment Promise */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-neutral-900 rounded-3xl text-white p-8 sm:p-14 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-300">
                Fulfillment & Customer Care
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold leading-tight">
                Designed for Pakistani Lifestyles & Needs
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                From festive gatherings in Lahore to executive meetings in Karachi, our catalog brings verified Pakistani silhouettes paired with prompt nationwide dispatch.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-neutral-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Cash on Delivery across serviced cities and delivery areas in Pakistan</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Size replacement and exchange assistance support</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Order confirmation and tracking dispatched via SMS & WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Operations Transparency Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/15 space-y-4">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Verified COD Delivery Process</span>
              </div>
              <p className="text-sm sm:text-base text-neutral-100 leading-relaxed">
                Every Cash on Delivery order is verified via phone or WhatsApp prior to booking with contracted courier fulfillment partners. You pay only when the parcel arrives at your hands.
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-neutral-300 border-t border-white/10">
                <div>
                  <strong className="text-white block font-serif">Customer Care Desk</strong>
                  <span>Mon - Sat: 10:00 AM - 8:00 PM PKT</span>
                </div>
                <span className="text-emerald-300 font-semibold bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700/60 text-[11px]">
                  Standard COD Policy
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
