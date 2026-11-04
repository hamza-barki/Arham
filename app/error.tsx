'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled storefront application error:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="text-xs uppercase font-bold tracking-widest text-rose-600">
        System Error
      </span>
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-2 mb-3">
        Something Went Wrong
      </h1>
      <p className="text-sm text-neutral-600 mb-8 max-w-sm mx-auto">
        We encountered an unexpected error while loading this page. Our engineering team has been notified.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="primary" size="md" onClick={() => reset()} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="md" className="gap-2">
            <Home className="w-4 h-4" />
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
