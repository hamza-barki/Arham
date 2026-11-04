import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle, Scale, AlertCircle } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND_NAME}`,
  description:
    'Terms and commercial conditions for ordering Clothes and Leather Bags with Cash on Delivery in Pakistan.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <nav className="flex items-center justify-center sm:justify-start text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Terms of Service</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
            Terms & Conditions of Sale
          </h1>
          <p className="text-neutral-600 text-sm mt-2">
            Please read these terms carefully before placing an order on {BRAND_NAME}.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm space-y-8 text-neutral-700 text-sm leading-relaxed">
          
          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-900" />
              1. Acceptance & Order Confirmation
            </h2>
            <p>
              By submitting an order on our website via Cash on Delivery (COD) or online payment, you enter into a binding commercial contract. All orders undergo mandatory phone/WhatsApp verification. We reserve the right to cancel any order if verification cannot be completed within 48 hours or if suspicious bot-like behavior is detected.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-900" />
              2. Handcrafted & Artisanal Characteristics
            </h2>
            <p>
              Our collections feature hand-embroidered luxury lawn, raw silk, and artisanal genuine leather. Due to digital display variations across mobile devices and the organic nature of leather hides and resham threads, subtle variations in grain texture or color tone (within 5-10%) are natural hallmarks of handcrafted authenticity.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-900" />
              3. Refusal of Delivery & RTO Policy
            </h2>
            <p>
              Ordering via Cash on Delivery incurs real packaging and courier delivery costs borne by our business. Unjustified refusal to accept parcels upon rider arrival without prior cancellation causes operational harm. Customers who repeatedly refuse confirmed COD parcels will be placed on our national delivery black-list and required to prepay future orders.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-900" />
              4. Governing Law
            </h2>
            <p>
              These Terms and any non-contractual obligations arising out of or in connection with them shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, subject to the jurisdiction of the courts of Lahore / Karachi.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
