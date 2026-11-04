'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  PhoneCall,
  ArrowRight,
  UserPlus,
  Lock,
  Sparkles,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { BRAND_NAME } from '@/lib/constants';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signUp } = useAuth();

  const orderNumber = searchParams?.get('num') || 'PK-10042';
  const prefillName = searchParams?.get('name') || '';
  const prefillPhone = searchParams?.get('phone') || '';
  const prefillEmail = searchParams?.get('email') || '';

  // Post-order account creation state
  const [password, setPassword] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handlePostOrderSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);

    if (!prefillEmail) {
      setAccountError('An email is required to register. Please sign up through the regular register page.');
      return;
    }

    if (password.length < 6) {
      setAccountError('Password must be at least 6 characters long.');
      return;
    }

    setIsCreatingAccount(true);
    const res = await signUp(prefillEmail, password, prefillName, prefillPhone, true);
    setIsCreatingAccount(false);

    if (res.error) {
      setAccountError(res.error);
    } else {
      setAccountSuccess(true);
      setTimeout(() => {
        router.push('/account');
      }, 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-10 shadow-sm text-center">
        
        {/* Brand Logo & Success Icon */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-sm ring-1 ring-neutral-200 bg-white">
            <Image
              src="/images/logo-icon.png"
              alt={BRAND_NAME}
              width={56}
              height={56}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
          Order Confirmed
        </span>

        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-neutral-900 mb-2">
          Shukriya! Your Order is Placed
        </h1>

        <p className="text-neutral-600 text-sm sm:text-base max-w-md mx-auto mb-6">
          We have received your Cash on Delivery order. Our warehouse team is now carefully packing your pieces.
        </p>

        {/* Order Details Card */}
        <div className="bg-neutral-50 rounded-2xl border border-neutral-200/80 p-5 text-left max-w-lg mx-auto mb-8 space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-neutral-200/60 pb-2.5">
            <span className="text-neutral-500">Order Reference #:</span>
            <span className="font-mono font-bold text-emerald-950 text-base">{orderNumber}</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-neutral-200/60 pb-2.5">
            <span className="text-neutral-500">Payment Mode:</span>
            <span className="font-semibold text-neutral-800">Cash on Delivery (COD)</span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-neutral-200/60 pb-2.5">
            <span className="text-neutral-500">Estimated Delivery:</span>
            <span className="font-semibold text-emerald-800">2 to 4 Working Days</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Courier Partner:</span>
            <span className="font-semibold text-neutral-800">TCS / Leopards / PostEx</span>
          </div>
        </div>

        {/* POST-ORDER CREATE ACCOUNT PROMPT (If Guest) */}
        {!user && prefillEmail && (
          <div className="max-w-lg mx-auto mb-10 text-left bg-gradient-to-br from-emerald-950 via-emerald-900 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              1-Click Account Creation
            </div>
            <h3 className="font-serif text-xl font-bold text-white mb-1">
              Save your details & track {orderNumber}
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed mb-5">
              Create an account now with your order email (<strong>{prefillEmail}</strong>). We’ll automatically link this order and save your address for future purchases.
            </p>

            {accountSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Account created! Redirecting to your account dashboard...</span>
              </div>
            ) : (
              <form onSubmit={handlePostOrderSignup} className="space-y-3">
                {accountError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{accountError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-200 uppercase tracking-wider mb-1">
                    Set a Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreatingAccount ? (
                    'Creating Account...'
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Save Account & Link Order
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* If already logged in: View In Account Button */}
        {user && (
          <div className="max-w-lg mx-auto mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
            <span className="flex items-center gap-1.5 font-medium">
              <Package className="w-4 h-4 text-emerald-700" />
              Order linked to your account: <strong>{user.email}</strong>
            </span>
            <Link
              href="/account"
              className="px-3 py-1.5 bg-emerald-950 text-white font-semibold rounded-lg hover:bg-emerald-900 transition-colors"
            >
              View in Dashboard
            </Link>
          </div>
        )}

        {/* What Happens Next Timeline */}
        <div className="text-left max-w-lg mx-auto mb-10 space-y-4">
          <h3 className="font-serif font-bold text-neutral-900 text-base">
            What Happens Next?
          </h3>

          <div className="space-y-3 text-xs sm:text-sm text-neutral-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-950 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <p>
                <strong>Order Verification:</strong> You will receive a WhatsApp message or brief call from our customer care team to verify delivery details.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-950 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <p>
                <strong>Dispatch & Tracking:</strong> Once dispatched, a live courier tracking link will be sent to your phone number.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-950 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <p>
                <strong>Doorstep Delivery:</strong> Hand over exact cash amount to the courier rider upon receiving your package.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Link href="/products" className="w-full sm:w-auto flex-1">
            <Button variant="primary" size="lg" className="w-full gap-2 bg-emerald-950 hover:bg-emerald-900">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <a
            href={`https://wa.me/923001234567?text=${encodeURIComponent(
              `Assalam o Alaikum, I have a question about my Order ${orderNumber}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1"
          >
            <Button variant="outline" size="lg" className="w-full gap-2 border-emerald-800 text-emerald-900 hover:bg-emerald-50">
              <PhoneCall className="w-4 h-4 text-emerald-700" />
              WhatsApp Support
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
