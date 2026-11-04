'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Truck, ShieldCheck, PhoneCall } from 'lucide-react';
import { STORE_CONFIG } from '@/lib/config';

export function AnnouncementBar() {
  const pathname = usePathname();

  // Hide on admin console routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const cleanPhone = STORE_CONFIG.supportWhatsApp.replace(/\D/g, '');
  const waNumber = cleanPhone.startsWith('92') ? cleanPhone : cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : '92' + cleanPhone;

  return (
    <div className="bg-emerald-950 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
        <div className="flex items-center gap-4 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            Cash on Delivery Across Pakistan 🇵🇰
          </span>
          <span className="hidden sm:inline text-emerald-700">|</span>
          <span className="hidden sm:inline text-emerald-200">
            Free Delivery on orders above <strong className="text-white">Rs. 3,000</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] sm:text-xs">
          <span className="hidden md:flex items-center gap-1 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            7-Day Easy Exchange
          </span>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Customer Helpline</span>
          </a>
        </div>
      </div>
    </div>
  );
}
