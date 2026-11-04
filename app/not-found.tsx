import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Compass, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 sm:py-32 text-center">
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto mb-6">
        <Compass className="w-10 h-10 text-emerald-800" />
      </div>

      <span className="text-xs uppercase font-bold tracking-widest text-emerald-800">
        404 Error
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 mt-2 mb-3">
        Page Not Found
      </h1>
      <p className="text-sm text-neutral-600 mb-8 max-w-sm mx-auto">
        The piece or page you are looking for has been moved, renamed, or is currently unavailable.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="primary" size="lg" className="w-full gap-2">
            Return to Homepage
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/category/clothes" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full">
            Browse Clothes
          </Button>
        </Link>
      </div>
    </div>
  );
}
