'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  PackageSearch,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  MapPin,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { trackOrder, TrackOrderResult } from '@/app/actions/track-order';
import { formatPKR } from '@/lib/utils';
import { BRAND_NAME } from '@/lib/constants';

export default function TrackOrderPage() {
  const [orderRef, setOrderRef] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<TrackOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderRef.trim()) {
      setError('Please provide your Order Number (e.g. PK-10001) or Confirmation Token.');
      return;
    }

    if (!phone.trim()) {
      setError('Please provide the mobile phone number used during checkout.');
      return;
    }

    startTransition(async () => {
      const res = await trackOrder(orderRef, phone);
      if (!res.success) {
        setError(res.error || 'Unable to find order.');
        setResult(null);
      } else {
        setResult(res);
        setError(null);
      }
    });
  };

  const handleFillDemo = () => {
    setOrderRef('PK-10001');
    setPhone('03001234567');
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <nav className="flex items-center justify-center text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Order Tracking</span>
          </nav>
          <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-300 mx-auto flex items-center justify-center mb-4 shadow-lg">
            <PackageSearch className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
            Track Your Consignment
          </h1>
          <p className="text-neutral-600 text-sm mt-2">
            Enter your order reference and mobile number to see real-time courier updates across Pakistan.
          </p>
        </div>

        {/* Tracking Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-10">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="orderRef" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Order Number or Token <span className="text-rose-500">*</span>
                </label>
                <input
                  id="orderRef"
                  type="text"
                  placeholder="e.g. PK-10001"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-mono"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs text-neutral-500 hover:text-emerald-950 underline self-start sm:self-auto"
              >
                Try sample order (PK-10001)
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-950 text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <PackageSearch className="w-4 h-4" />
                    Track Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Result View */}
        {result?.order && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Order Overview Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-100 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                    Consignment ID
                  </span>
                  <h2 className="font-mono text-2xl font-bold text-neutral-950 mt-0.5">
                    {result.order.orderNumber}
                  </h2>
                </div>
                <div className="self-start sm:self-auto">
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {result.order.statusLabel}
                  </span>
                </div>
              </div>

              {/* Order Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-neutral-100 text-xs">
                <div>
                  <span className="text-neutral-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Placed On
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {new Date(result.order.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5" /> Destination
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {result.order.city} {result.order.province ? `(${result.order.province})` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-400 flex items-center gap-1 mb-1">
                    <CreditCard className="w-3.5 h-3.5" /> Payment
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {result.order.paymentMethod} ({formatPKR(result.order.totalAmount)})
                  </span>
                </div>

                <div>
                  <span className="text-neutral-400 flex items-center gap-1 mb-1">
                    <Truck className="w-3.5 h-3.5" /> Courier
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {result.order.courier || 'Pending Assignment'}
                  </span>
                </div>
              </div>

              {/* Tracking Link (if assigned) */}
              {result.order.trackingNumber && (
                <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-amber-800 font-semibold block">
                      Tracking / CN Number: <span className="font-mono">{result.order.trackingNumber}</span>
                    </span>
                    <span className="text-amber-700/80">
                      Consignment handed over to {result.order.courier}
                    </span>
                  </div>
                  {result.order.trackingUrl && (
                    <a
                      href={result.order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold transition-colors self-start sm:self-auto"
                    >
                      Track on Courier Site
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Timeline Progress */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-neutral-950 mb-6">
                Fulfillment Timeline
              </h3>
              
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                {result.order.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    {/* Status node */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-0 w-5 sm:w-7 h-5 sm:h-7 rounded-full flex items-center justify-center ${
                        event.completed
                          ? 'bg-emerald-900 text-white ring-4 ring-emerald-50'
                          : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      {event.completed ? (
                        <CheckCircle2 className="w-3 sm:w-4 h-3 sm:h-4" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-neutral-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className={`text-sm font-semibold ${event.completed ? 'text-neutral-900' : 'text-neutral-400'}`}>
                          {event.label}
                        </h4>
                        {event.date && (
                          <span className="text-xs text-neutral-400">
                            {new Date(event.date).toLocaleString('en-PK', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        )}
                      </div>
                      {event.note && (
                        <p className="text-xs text-neutral-500 mt-1 bg-neutral-50 p-2 rounded-lg border border-neutral-100 inline-block">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Event Logs from order_events */}
              {result.order.eventsList && result.order.eventsList.length > 0 && (
                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-800" />
                    Verified Event Activity Log
                  </h4>
                  <div className="space-y-2">
                    {result.order.eventsList.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase font-mono">
                            {log.status.replace(/_/g, ' ')}
                          </span>
                          {log.note && (
                            <span className="text-neutral-700 font-medium">{log.note}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                          {new Date(log.createdAt).toLocaleString('en-PK', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Items Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-neutral-950 mb-4">
                Ordered Items
              </h3>
              <div className="divide-y divide-neutral-100 text-xs">
                {result.order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-neutral-800">{item.productName}</span>
                      <span className="text-neutral-400 block mt-0.5">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-neutral-900 font-mono">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Support CTA */}
            <div className="p-6 rounded-3xl bg-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-serif text-base font-bold mb-1">Need help with your order?</h4>
                <p className="text-xs text-emerald-200">
                  Our customer care team is available on WhatsApp 7 days a week (10 AM to 10 PM PKT).
                </p>
              </div>
              <a
                href={`https://wa.me/923001234567?text=${encodeURIComponent(
                  `Hello ${BRAND_NAME}, I need an update on my order ${result.order.orderNumber}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
