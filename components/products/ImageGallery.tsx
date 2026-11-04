'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types';
import { cn } from '@/lib/utils';
import { Ruler } from 'lucide-react';
import cloudinaryLoader from '@/lib/image-loader';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
  hasSizeChart?: boolean;
  onOpenSizeChart?: () => void;
}

export function ImageGallery({
  images,
  productName,
  hasSizeChart = false,
  onOpenSizeChart,
}: ImageGalleryProps) {
  // CRITICAL REQUIREMENT: Filter out images where is_size_chart = true
  const galleryImages = images
    .filter((img) => !img.is_size_chart)
    .sort((a, b) => a.position - b.position);

  const fallbackImage = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80';
  const displayImages = galleryImages.length > 0 ? galleryImages : [{
    id: 'fallback',
    product_id: '',
    cloudinary_url: fallbackImage,
    cloudinary_public_id: 'fallback',
    position: 0,
    is_size_chart: false,
    created_at: new Date().toISOString(),
  }];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = displayImages[selectedIndex] || displayImages[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnail Strip */}
      {displayImages.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-20 md:max-h-[580px] scrollbar-none py-1">
          {displayImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  'relative w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border-2 transition-all duration-200 focus:outline-none',
                  isSelected
                    ? 'border-emerald-800 ring-2 ring-emerald-800/20 shadow-sm'
                    : 'border-transparent hover:border-neutral-300 opacity-70 hover:opacity-100'
                )}
                aria-label={`View image ${idx + 1} of ${productName}`}
              >
                <Image
                  src={img.cloudinary_url}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  loader={cloudinaryLoader}
                  className="w-full h-full object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Display (LCP for Product Page) */}
      <div className="relative flex-1 aspect-[3/4] md:max-h-[600px] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 group">
        <Image
          src={activeImage.cloudinary_url}
          alt={`${productName} view ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          loader={cloudinaryLoader}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Size Chart Quick Button Overlay if available */}
        {hasSizeChart && onOpenSizeChart && (
          <button
            type="button"
            onClick={onOpenSizeChart}
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md hover:bg-white text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-neutral-200 transition-all active:scale-95"
          >
            <Ruler className="w-3.5 h-3.5 text-emerald-800" />
            Size Guide
          </button>
        )}

        {/* Counter indicator */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
          {selectedIndex + 1} / {displayImages.length}
        </div>
      </div>
    </div>
  );
}
