import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND_NAME}`,
  description:
    'Our commitment to customer data privacy, encrypted checkout records, and secure logistics handling across Pakistan.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <nav className="flex items-center justify-center sm:justify-start text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Privacy Policy</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
            Privacy & Data Protection Policy
          </h1>
          <p className="text-neutral-600 text-sm mt-2">
            Last Updated: November 2026 • Compliant with Pakistani consumer privacy regulations.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm space-y-8 text-neutral-700 text-sm leading-relaxed">
          
          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-900" />
              1. Information We Collect
            </h2>
            <p>
              When you browse our storefront or place a Cash on Delivery (COD) order, we collect essential operational information necessary to fulfill your delivery:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Contact Information:</strong> Full recipient name, mobile phone number, and optional email address.</li>
              <li><strong>Delivery Logistics:</strong> Complete delivery address, nearest landmark, city, and province for courier routing.</li>
              <li><strong>Order History:</strong> Product items ordered, sizes selected, total PKR value, and courier tracking identifiers.</li>
              <li><strong>Technical Metadata:</strong> Anonymized IP addresses and device browser types for anti-spam fraud prevention on COD bookings.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-900" />
              2. How Your Information is Utilized
            </h2>
            <p>Your details are used exclusively for legitimate e-commerce operations:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Printing courier airway bills (Consignment Notes) with TCS, Leopards, or Trax.</li>
              <li>Transmitting WhatsApp or SMS order verification and tracking notifications.</li>
              <li>Coordinating exchanges, size replacements, or warranty claims.</li>
              <li>Preventing automated bot abuse and fictitious fake COD bookings.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-900" />
              3. Non-Disclosure & Security
            </h2>
            <p>
              We enforce strict <strong>PostgreSQL Row-Level Security (RLS)</strong> isolation. Customer database tables are completely inaccessible to unauthorized parties. <strong>We do not sell, rent, or trade your personal contact details to external marketing agencies or third-party data brokers.</strong>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-900" />
              4. Data Deletion Requests
            </h2>
            <p>
              You may at any time request the deletion of your historical order contact record or opt-out of marketing notifications by messaging our care desk at{' '}
              <a href="mailto:privacy@brandname.pk" className="text-emerald-900 font-semibold underline">
                privacy@brandname.pk
              </a>{' '}
              or contacting our WhatsApp helpline.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
