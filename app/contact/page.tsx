'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { submitContactForm, ContactFormResult } from '@/app/actions/contact';
import { BRAND_NAME } from '@/lib/constants';
import { STORE_CONFIG } from '@/lib/config';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orderRef: '',
    message: '',
    website_hp: '', // Honeypot field
  });

  const [result, setResult] = useState<ContactFormResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    startTransition(async () => {
      const res = await submitContactForm(formData);
      if (!res.success) {
        setError(res.error || 'Failed to submit form.');
      } else {
        setResult(res);
        setFormData({
          name: '',
          email: '',
          phone: '',
          orderRef: '',
          message: '',
          website_hp: '',
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <nav className="flex items-center justify-center text-xs text-neutral-500 gap-2 mb-3">
            <Link href="/" className="hover:text-emerald-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Contact Us</span>
          </nav>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Customer Concierge
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-950 tracking-tight">
            We’re Here to Assist You
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mt-3 leading-relaxed">
            Have questions about a design, custom measurements, or order tracking? Reach out to our concierge team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* WhatsApp Priority Card */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-neutral-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
              <span className="text-xs uppercase tracking-widest text-amber-300 font-bold block mb-2">
                Fastest Response
              </span>
              <h2 className="font-serif text-2xl font-bold mb-2">
                Direct WhatsApp Support
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-6">
                Our support specialists are online Monday through Saturday to help with live video consultations, size checks, and parcel updates.
              </p>
              <a
                href={`https://wa.me/${STORE_CONFIG.supportWhatsApp.replace(/\D/g, '')}?text=Hello%20I%20have%20an%20inquiry%20regarding%20an%20order.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-sm transition-colors shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp Helpline
              </a>
            </div>

            {/* Studio & Office Locations */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6 text-sm">
              <h3 className="font-serif text-lg font-bold text-neutral-950">
                Studio Locations & Contact
              </h3>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Lahore Design Studio</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    M.M. Alam Road, Gulberg III, Lahore, Punjab 54000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Karachi Distribution Hub</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Block 4, Clifton, Karachi, Sindh 75600
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Direct Email</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    contact@brandname.pk / care@brandname.pk
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">Operating Hours</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Monday to Saturday: 10:00 AM – 10:00 PM PKT<br />
                    Sunday: Closed (WhatsApp messages queued for Monday)
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-neutral-950 mb-2">
                Send a Message
              </h2>
              <p className="text-neutral-500 text-xs sm:text-sm mb-6">
                Fill in the details below and a concierge representative will get in touch with you shortly.
              </p>

              {result?.success && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <strong className="block font-semibold">Message Dispatched!</strong>
                    <span>{result.message}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                  <div>
                    <strong className="block font-semibold">Submission Notice</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field (hidden from real users) */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website_hp">Leave this empty</label>
                  <input
                    type="text"
                    id="website_hp"
                    name="website_hp"
                    tabIndex={-1}
                    value={formData.website_hp}
                    onChange={(e) => setFormData({ ...formData, website_hp: e.target.value })}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fatima Ali"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                      Phone Number (03XX)
                    </label>
                    <input
                      type="tel"
                      placeholder="03001234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="fatima@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                      Order Reference (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PK-10001"
                      value={formData.orderRef}
                      onChange={(e) => setFormData({ ...formData, orderRef: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe how we can assist you..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 bg-emerald-950 text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? (
                    'Transmitting Message...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Inquiry
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
