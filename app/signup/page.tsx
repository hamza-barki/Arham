'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BRAND_NAME } from '@/lib/constants';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/account';

  const prefillEmail = searchParams?.get('email') || '';
  const prefillName = searchParams?.get('name') || '';
  const prefillPhone = searchParams?.get('phone') || '';

  const { signUp, signInWithGoogle, user } = useAuth();

  const [fullName, setFullName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Marketing consent MUST be unchecked by default per requirements
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  React.useEffect(() => {
    if (user && !successMsg) {
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router, successMsg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    const res = await signUp(email, password, fullName, phone, marketingConsent);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg(
        'Account created successfully! We have linked your previous orders. Redirecting to your dashboard...'
      );
      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        {/* Brand header */}
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
            Create Your Account
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Enjoy 1-click Pakistani checkout, track consignments live, and save multiple addresses.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-neutral-200/80 shadow-sm">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ayesha Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Mobile Number (03XX)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-mono"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Used to automatically link your previous Cash on Delivery orders!
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ayesha@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Choose Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Marketing Consent: MUST be unchecked by default */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-emerald-900 focus:ring-emerald-800 mt-0.5"
                />
                <span className="text-xs text-neutral-600 leading-normal">
                  Send me VIP previews, new unstitched lawn drops, and leather bag sale notifications via WhatsApp & Email. (Uncheck anytime)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-950 text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                'Registering Account...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="mt-6 mb-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-neutral-400 font-medium uppercase tracking-wider">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign up with Google
          </button>

        </div>

        {/* Footer Link */}
        <p className="mt-8 text-center text-xs text-neutral-500">
          Already registered?{' '}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
            className="font-bold text-emerald-900 hover:text-emerald-950 underline"
          >
            Sign In here
          </Link>
        </p>

      </div>
    </div>
  );
}
