import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { RefreshCw, CheckCircle2, AlertTriangle, MessageCircle, HelpCircle } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Exchange & Return Policy | ${BRAND_NAME}`,
  description:
    '7-day hassle-free exchange policy for Clothes and Leather Bags. Fast size replacement and defect claims via WhatsApp.',
};

export default function ExchangePolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <nav className="flex items-center justify-center sm:justify-start text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Exchange Policy</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
            7-Day Exchange & Returns
          </h1>
          <p className="text-neutral-600 text-sm mt-2">
            We want you to love your purchase. If a size doesn’t fit or an item arrived imperfect, we make it right.
          </p>
        </div>

        {/* Highlight Card */}
        <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 mb-10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-amber-300 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> 7-Day Window
            </span>
            <h2 className="font-serif text-2xl font-bold">Fast Size & Color Exchange</h2>
            <p className="text-emerald-200 text-xs sm:text-sm max-w-lg">
              Exchange your garment for a different size or report transit defects within 7 days of delivery.
            </p>
          </div>
          <a
            href="https://wa.me/923001234567?text=Hello%20I%20would%20like%20to%20request%20an%20exchange%20for%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-2 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            Initiate on WhatsApp
          </a>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm space-y-8 text-neutral-700 text-sm leading-relaxed">
          
          <section>
            <h3 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-900" />
              1. Eligibility Criteria
            </h3>
            <p>To qualify for an exchange:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>The exchange request must be logged within <strong>7 calendar days</strong> from the delivery timestamp.</li>
              <li>Garments must be unworn, unwashed, unaltered, and completely free from perfume odors or makeup stains.</li>
              <li>All original brand swing tags, barcode labels, and dust bags (for leather bags) must remain attached.</li>
              <li>Proof of purchase (Order reference e.g. <code>PK-10001</code> or shipping label photo) is required.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-900" />
              2. How the Exchange Process Works
            </h3>
            <ol className="list-decimal pl-5 space-y-3 mt-2">
              <li>
                <strong>Step 1: Contact Support</strong> — Send a WhatsApp message to our customer helpline with your Order Number, pictures of the article, and the replacement size desired.
              </li>
              <li>
                <strong>Step 2: Approval & Return Booking</strong> — Once approved by our team within 4-8 working hours, you can courier the parcel back to our fulfillment hub (Lahore / Karachi) or we can arrange a reverse pickup if available in your city.
              </li>
              <li>
                <strong>Step 3: Quality Check & Dispatch</strong> — Upon arrival and inspection at our warehouse, your fresh replacement piece will be dispatched immediately with zero extra shipping charges.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              3. Defective or Incorrect Items
            </h3>
            <p>
              In the rare circumstance that an article arrives damaged, defective, or incorrect in design:
            </p>
            <p className="mt-2 bg-amber-50/80 border border-amber-200 p-4 rounded-xl text-xs text-amber-900">
              Please share a short video or photograph of the defect within <strong>48 hours</strong> of unboxing. We will arrange a free exchange pickup and prioritize dispatching your replacement piece at 100% company cost.
            </p>
          </section>

          <section>
            <h3 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-900" />
              4. Non-Exchangeable Items
            </h3>
            <p>The following categories are strictly non-exchangeable for hygiene and bespoke reasons:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2 text-xs text-neutral-600">
              <li>Unstitched lawn fabric once cut or stitched by the customer or local tailor.</li>
              <li>Items purchased during clearance liquidation or final flash sales.</li>
            </ul>
          </section>

        </div>

      </div>
    </div>
  );
}
