'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';
import { STORE_CONFIG } from '@/lib/config';

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
}

export function WhatsAppFloatingButton({ phoneNumber }: WhatsAppFloatingButtonProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show a subtle attention tooltip after 3 seconds, auto hide after 8s
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 8000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Do not render on admin pages or before mount
  if (!mounted || !pathname || pathname.startsWith('/admin')) {
    return null;
  }

  // Get raw phone number and sanitize for WhatsApp international format
  const rawNumber =
    phoneNumber ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ||
    STORE_CONFIG.supportWhatsApp;

  const cleanDigits = rawNumber.replace(/\D/g, '');
  const waNumber = cleanDigits.startsWith('92')
    ? cleanDigits
    : cleanDigits.startsWith('0')
    ? '92' + cleanDigits.slice(1)
    : '92' + cleanDigits;

  // Build contextual prefilled message
  let prefilledMessage = `Assalam-o-Alaikum! I have an inquiry about ${BRAND_NAME} products.`;

  if (pathname.startsWith('/product/') || pathname.startsWith('/products/')) {
    const slug = pathname.split('/').pop() || '';
    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    prefilledMessage = `Assalam-o-Alaikum! I have a question about "${formattedTitle}":\n${currentUrl}`;
  } else if (pathname.includes('/order-confirmation/')) {
    const orderId = pathname.split('/').pop() || '';
    prefilledMessage = `Assalam-o-Alaikum! I just placed an order (Ref: ${orderId}) and would like to confirm the details.`;
  } else if (pathname === '/orders/track') {
    prefilledMessage = `Assalam-o-Alaikum! I would like to track my order consignment with your support team.`;
  } else if (pathname === '/cart' || pathname === '/checkout') {
    prefilledMessage = `Assalam-o-Alaikum! I need assistance with completing my order on ${BRAND_NAME}.`;
  }

  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(prefilledMessage)}`;

  return (
    <div
      aria-label="Contact support on WhatsApp"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 select-none group"
    >
      {/* Tooltip Pill */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900 text-white text-xs font-semibold py-1.5 px-3 rounded-full shadow-lg border border-neutral-700 animate-in fade-in slide-in-from-right-2 duration-300">
          <span>Need help? Chat with us</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-neutral-400 hover:text-white ml-0.5"
            aria-label="Dismiss help notice"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with our support team on WhatsApp"
        className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Animated Ping Dot */}
        <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white border-2 border-[#25D366]"></span>
        </span>

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current stroke-none" />

        {/* Accessible Screen Reader Text */}
        <span className="sr-only">Chat on WhatsApp ({rawNumber})</span>
      </a>
    </div>
  );
}

