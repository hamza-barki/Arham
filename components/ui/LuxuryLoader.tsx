'use client';

import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface LuxuryLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export function LuxuryLoader({
  message = 'Loading Collection...',
  subMessage = 'Exquisite Pakistani Pret & Handcrafted Leather',
  fullScreen = false,
}: LuxuryLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      {/* Animated Brand Emblem */}
      <div className="relative mb-6">
        {/* Outer glowing pulsing halo */}
        <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-600/30 via-emerald-400/20 to-amber-500/30 rounded-full blur-md animate-pulse" />

        {/* Outer spinning ring */}
        <div className="w-16 h-16 rounded-full border-2 border-emerald-900/20 border-t-emerald-800 border-r-amber-500 animate-spin" />

        {/* Center Emblem */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-emerald-900 text-white flex items-center justify-center shadow-md">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
          </div>
        </div>

        {/* Small floating sparkle */}
        <div className="absolute -top-1 -right-1 text-amber-500 animate-bounce">
          <Sparkles className="w-4 h-4 fill-amber-400" />
        </div>
      </div>

      {/* Brand Title / Text */}
      <h3 className="font-serif text-lg font-bold text-neutral-900 tracking-wide mb-1">
        {message}
      </h3>
      <p className="text-xs text-neutral-500 font-medium max-w-xs mb-4">
        {subMessage}
      </p>

      {/* Progress Line */}
      <div className="w-40 h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-800 via-emerald-500 to-amber-500 rounded-full animate-shimmer w-full" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
