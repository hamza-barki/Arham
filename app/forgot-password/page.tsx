'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BRAND_NAME } from '@/lib/constants';

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await resetPasswordForEmail(email);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setIsSent(true);
    }
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
          <h1 className="font-serif text-2xl font-bold text-neutral-900">
            Reset Password
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Enter your email and we’ll send you a secure link to reset your account password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-neutral-200/80 shadow-sm">
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-xl font-bold text-neutral-900">
                Check Your Inbox
              </h2>
              <p className="text-xs text-neutral-600 leading-relaxed">
                If an account exists for <strong>{email}</strong>, a password reset link has been dispatched. Please check your spam or promotions folder as well.
              </p>
              <div className="pt-4 border-t border-neutral-100">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-950 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-950 text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  'Transmitting Link...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
