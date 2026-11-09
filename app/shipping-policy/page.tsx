import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Clock, ShieldCheck, Banknote, MapPin } from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Shipping & Delivery Policy | ${BRAND_NAME}`,
  description:
    'Nationwide delivery across Pakistan via TCS & Leopards. Flat rate Rs. 200, Free delivery over Rs. 3,000. Cash on Delivery (COD) accepted.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50/50 py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="mb-10 text-center sm:text-left">
          <nav className="flex items-center justify-center sm:justify-start text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Shipping Policy</span>
          </nav>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
            Nationwide Shipping & Delivery
          </h1>
          <p className="text-neutral-600 text-sm mt-2">
            Last updated: November 2026 • Valid for all deliveries across Pakistan.
          </p>
        </div>

        {/* Highlight Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Standard Rate</span>
              <span className="text-sm font-bold text-neutral-900">Rs. 200 Flat</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Free Shipping</span>
              <span className="text-sm font-bold text-neutral-900">Orders above Rs. 3,000</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Delivery Time</span>
              <span className="text-sm font-bold text-neutral-900">2 to 4 Working Days</span>
            </div>
          </div>
        </div>

        {/* Policy Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm space-y-8 text-neutral-700 text-sm leading-relaxed">
          
          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-900" />
              1. Delivery Coverage
            </h2>
            <p>
              {BRAND_NAME} ships across major cities, towns, and tehsils in Pakistan via our contracted logistics partners, including TCS, Leopards Courier, and PostEx. We deliver to residential addresses, commercial offices, and university hostels.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-900" />
              2. Delivery Timelines
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Major Metropolitan Cities (Lahore, Karachi, Islamabad, Rawalpindi):</strong> 2 to 3 business days from order confirmation.
              </li>
              <li>
                <strong>Other Urban Cities (Faisalabad, Multan, Peshawar, Sialkot, Gujranwala, Hyderabad, Quetta):</strong> 3 to 4 business days.
              </li>
              <li>
                <strong>Remote / Rural Areas & Azad Kashmir:</strong> 4 to 6 business days depending on road transit conditions.
              </li>
            </ul>
            <p className="text-xs text-neutral-500 mt-2">
              * Note: Delivery timelines exclude Sundays and official public gazette holidays. During seasonal sale events (such as Eid collections or 11.11), transit may take an additional 24-48 hours.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-900" />
              3. Cash on Delivery (COD) Protocol
            </h2>
            <p>
              To safeguard our customers and ensure seamless delivery:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mt-2">
              <li>
                <strong>Order Confirmation:</strong> All COD orders receive an automated WhatsApp confirmation message or a quick phone verification call prior to parcel booking.
              </li>
              <li>
                <strong>Exact Change:</strong> Customers are requested to have the exact cash amount ready upon arrival of the courier rider.
              </li>
              <li>
                <strong>Parcel Inspection:</strong> Per standard Pakistani courier regulations (TCS / Leopards policy), riders are not authorized to allow open-box inspection prior to receiving payment. In case of any defect or size mismatch, our <strong>7-Day Exchange Policy</strong> covers you completely once payment is handed over.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-950 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-900" />
              4. Consignment Tracking
            </h2>
            <p>
              As soon as your parcel is handed over to the courier, an SMS & WhatsApp notification containing your Consignment Number (CN) and courier tracking link will be dispatched directly to your phone.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
