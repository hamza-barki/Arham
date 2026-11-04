'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { BellOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { processUnsubscribe, UnsubscribeResult } from '@/app/actions/unsubscribe';
import { BRAND_NAME } from '@/lib/constants';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const initialTarget = searchParams?.get('email') || searchParams?.get('phone') || '';

  const [identifier, setIdentifier] = useState(initialTarget);
  const [result, setResult] = useState<UnsubscribeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTarget) {
      setIdentifier(initialTarget);
    }
  }, [initialTarget]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    const res = await processUnsubscribe(identifier);
    setIsLoading(false);
    setResult(res);
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="relative w-11 h-11 rounded-full overflow-hidden shadow-sm ring-1 ring-neutral-200 bg-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/images/logo-icon.png"
                alt={BRAND_NAME}
                width={44}
                height={44}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-serif text-3xl font-bold tracking-tight text-neutral-950 group-hover:text-emerald-950 transition-colors">
              {BRAND_NAME}
            </span>
          </Link>
          <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BellOff className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-neutral-900">
            Unsubscribe from Marketing
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Opt out of promotional WhatsApp broadcasts and marketing newsletters.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-neutral-200/80 shadow-sm text-center">
          {result?.success ? (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-xl font-bold text-neutral-900">
                Unsubscribed Successfully
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {result.message}
              </p>
              <p className="text-[11px] text-neutral-400">
                You will still receive important transactional SMS/WhatsApp messages regarding your live order fulfillment and courier tracking.
              </p>
              <div className="pt-4 border-t border-neutral-100">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-950 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Storefront
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUnsubscribe} className="space-y-4 text-left">
              {result && !result.success && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{result.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Email or Mobile Number (03XX)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567 or email@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Processing Opt-out...' : 'Confirm Unsubscribe'}
              </button>

              <div className="pt-3 text-center">
                <Link
                  href="/account"
                  className="text-xs text-emerald-950 font-medium hover:underline"
                >
                  Manage preferences in your account instead
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
