'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutInput } from '@/lib/validations/order';
import { placeOrder } from '@/app/actions/order';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PAKISTAN_CITIES } from '@/lib/constants';
import { formatPKR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Address } from '@/types';
import AddressPicker from '@/components/checkout/AddressPicker';
import { getStoreSettingsAction } from '@/app/actions/admin-settings';
import { calculateHonestTotal, DEFAULT_STORE_SETTINGS, StoreSettings } from '@/lib/settings';
import cloudinaryLoader from '@/lib/image-loader';
import {
  Banknote,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  MapPin,
  Sparkles,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, isHydrated, subtotal, shippingFee, total, clearCart } = useCart();
  const { user, profile } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    getStoreSettingsAction().then((res) => {
      if (res.success && res.settings) setSettings(res.settings);
    });
  }, []);

  // Saved Addresses for Logged-In Customer
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('manual');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      province: 'Punjab',
      city: 'Lahore',
      courierCityCode: 'LHE',
      areaId: '',
      areaName: '',
      isCustomArea: false,
      customAreaName: '',
      address: '',
      landmark: '',
      postalCode: '',
      lat: null,
      lng: null,
      notes: '',
      paymentMethod: 'COD',
      customerId: '',
      marketingConsent: false, // UNCHECKED BY DEFAULT
    },
  });

  const provinceVal = watch('province') || 'Punjab';
  const cityVal = watch('city') || 'Lahore';
  const areaIdVal = watch('areaId');
  const areaNameVal = watch('areaName') || '';
  const isCustomAreaVal = watch('isCustomArea') || false;
  const customAreaNameVal = watch('customAreaName') || '';
  const addressVal = watch('address') || '';
  const landmarkVal = watch('landmark') || '';
  const latVal = watch('lat');
  const lngVal = watch('lng');
  const phoneVal = watch('phone') || '';
  const customerNameVal = watch('customerName') || '';

  const handleProvinceChange = (p: string) => {
    setValue('province', p, { shouldValidate: true });
    setValue('city', '', { shouldValidate: true });
    setValue('courierCityCode', '');
    setValue('areaId', '');
    setValue('areaName', '', { shouldValidate: true });
    setValue('isCustomArea', false);
    setValue('customAreaName', '');
  };

  const handleCityChange = (c: string, courierCode?: string) => {
    setValue('city', c, { shouldValidate: true });
    if (courierCode) setValue('courierCityCode', courierCode);
    setValue('areaId', '');
    setValue('areaName', '', { shouldValidate: true });
    setValue('isCustomArea', false);
    setValue('customAreaName', '');
  };

  const handleAreaChange = (id: string | null, name: string, isCustom: boolean) => {
    setValue('areaId', id || '');
    setValue('areaName', name, { shouldValidate: true });
    setValue('isCustomArea', isCustom);
    if (!isCustom) {
      setValue('customAreaName', '');
    }
  };

  const handleCustomAreaNameChange = (customName: string) => {
    setValue('customAreaName', customName, { shouldValidate: true });
    setValue('areaName', customName, { shouldValidate: true });
  };

  const applyAddress = useCallback((addr: Address) => {
    setValue('customerName', addr.full_name, { shouldValidate: true });
    setValue('phone', addr.phone, { shouldValidate: true });
    setValue('address', addr.address_line, { shouldValidate: true });
    setValue('city', addr.city, { shouldValidate: true });
    setValue('province', addr.province, { shouldValidate: true });
    setValue('areaId', addr.area_id || '');
    setValue('areaName', addr.address_line.split(',')[0] || addr.city);
    setValue('landmark', addr.landmark || '');
    setValue('lat', addr.lat ?? null);
    setValue('lng', addr.lng ?? null);
    setValue('isCustomArea', Boolean((addr as any).is_custom_area));
    if ((addr as any).is_custom_area) {
      setValue('customAreaName', addr.address_line);
    }
  }, [setValue]);

  // Fetch saved addresses if logged in
  const fetchSavedAddresses = useCallback(async () => {
    if (!user) return;

    if (!isSupabaseConfigured()) {
      const mockAddr: Address = {
        id: 'addr-default',
        user_id: user.id,
        full_name: profile?.full_name || 'Valued Customer',
        phone: profile?.phone || '03001234567',
        province: 'Punjab',
        city: 'Lahore',
        area_id: null,
        address_line: 'House 12-A, Gulberg III',
        landmark: 'Near Main Market',
        lat: null,
        lng: null,
        is_default: true,
        created_at: new Date().toISOString(),
      };
      setSavedAddresses([mockAddr]);
      setSelectedAddressId(mockAddr.id);
      applyAddress(mockAddr);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (!error && data && data.length > 0) {
        setSavedAddresses(data as Address[]);
        const defaultAddr = data.find((a: Address) => a.is_default) || data[0];
        setSelectedAddressId(defaultAddr.id);
        applyAddress(defaultAddr);
      }
    } catch (e) {
      console.warn('Failed to fetch checkout saved addresses:', e);
    }
  }, [user, profile, applyAddress]);

  useEffect(() => {
    if (user) {
      setValue('customerId', user.id);
      if (user.email) setValue('email', user.email);
      if (profile?.full_name) setValue('customerName', profile.full_name);
      if (profile?.phone) setValue('phone', profile.phone);
      fetchSavedAddresses();
    }
  }, [user, profile, setValue, fetchSavedAddresses]);

  // Handle address select change
  const handleAddressSelectChange = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'manual') {
      setValue('address', '');
      setValue('landmark', '');
    } else {
      const found = savedAddresses.find((a) => a.id === id);
      if (found) applyAddress(found);
    }
  };

  // Loading from client storage
  if (!isHydrated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-12 h-12 bg-neutral-200 rounded-full mx-auto mb-4" />
        <div className="h-6 w-48 bg-neutral-200 rounded mx-auto mb-2" />
        <div className="h-4 w-64 bg-neutral-200 rounded mx-auto" />
      </div>
    );
  }

  // Empty cart edge case
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-neutral-900 mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          You have no items in your cart to checkout. Please explore our collections first.
        </p>
        <Link href="/">
          <Button variant="primary">Return to Shop</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await placeOrder(data, items);

      if (!res.success) {
        setServerError(res.error || 'Failed to place order. Please review your details.');
        setIsSubmitting(false);
        return;
      }

      // Order created successfully! Clear cart & redirect
      clearCart();
      const redirectToken = res.confirmationToken || res.orderId;
      const queryParams = new URLSearchParams({
        num: res.orderNumber || '',
        name: data.customerName,
        phone: data.phone,
        email: data.email || '',
      });

      router.push(`/order-confirmation/${redirectToken}?${queryParams.toString()}`);
    } catch (err: any) {
      setServerError(err.message || 'An unexpected network error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Checkout Title & Guest notice */}
      <div className="mb-8 pb-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
            Fast Checkout
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            Cash on Delivery nationwide with zero upfront card requirement
          </p>
        </div>

        {/* Guest or Logged in Banner */}
        {!user ? (
          <div className="text-xs bg-amber-50/80 border border-amber-200/80 px-4 py-2 rounded-xl text-neutral-700">
            <span>Already have an account? </span>
            <Link
              href="/login?redirect=/checkout"
              className="text-emerald-950 font-bold hover:underline"
            >
              Sign in here
            </Link>
            <span className="text-neutral-400"> (Guest checkout is default)</span>
          </div>
        ) : (
          <div className="text-xs bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Logged in as <strong>{profile?.full_name || user.email}</strong></span>
          </div>
        )}
      </div>

      {serverError && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to place order</p>
            <p className="text-xs text-rose-700 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Anti-spam honeypot */}
        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            {...register('website_url_hp')}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Delivery Form (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Customer & Delivery Details */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="font-serif text-lg font-bold text-neutral-900">
                    Delivery & Contact Information
                  </h2>
                </div>
              </div>

              {/* Saved Address Selector (if logged in and has addresses) */}
              {user && savedAddresses.length > 0 && (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Use a Saved Address:
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => handleAddressSelectChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                  >
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.is_default ? '★ Default: ' : ''}{a.full_name} - {a.address_line}, {a.city}
                      </option>
                    ))}
                    <option value="manual">+ Enter a different delivery address</option>
                  </select>
                </div>
              )}

              {/* Mobile-First Address Picker: Province -> City -> Area -> Street -> Landmark -> Map -> Phone -> Name */}
              <AddressPicker
                province={provinceVal}
                city={cityVal}
                areaId={areaIdVal}
                areaName={areaNameVal}
                isCustomArea={isCustomAreaVal}
                customAreaName={customAreaNameVal}
                addressLine={addressVal}
                landmark={landmarkVal}
                lat={latVal}
                lng={lngVal}
                phone={phoneVal}
                customerName={customerNameVal}
                onProvinceChange={handleProvinceChange}
                onCityChange={handleCityChange}
                onAreaChange={handleAreaChange}
                onCustomAreaNameChange={handleCustomAreaNameChange}
                onAddressLineChange={(val) => setValue('address', val, { shouldValidate: true })}
                onLandmarkChange={(val) => setValue('landmark', val)}
                onCoordinatesChange={(lat, lng) => {
                  setValue('lat', lat);
                  setValue('lng', lng);
                }}
                onPhoneChange={(val) => setValue('phone', val, { shouldValidate: true })}
                onCustomerNameChange={(val) => setValue('customerName', val, { shouldValidate: true })}
                errors={{
                  province: errors.province?.message,
                  city: errors.city?.message,
                  areaName: errors.areaName?.message,
                  customAreaName: errors.customAreaName?.message,
                  address: errors.address?.message,
                  landmark: errors.landmark?.message,
                  phone: errors.phone?.message,
                  customerName: errors.customerName?.message,
                }}
              />

              {/* Secondary Details: Email & Delivery Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                {/* Email (Optional) */}
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-xs font-semibold text-neutral-800 mb-1">
                    Email Address <span className="text-neutral-400 font-normal">(Optional for tracking invoices)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ayesha@example.com"
                    {...register('email')}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition-all"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Special Instructions / Notes */}
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-xs font-semibold text-neutral-800 mb-1">
                    Delivery Instructions / Special Notes <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="notes"
                    type="text"
                    placeholder="e.g. Please call before arriving or deliver after 2 PM"
                    {...register('notes')}
                    className="w-full text-sm px-4 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Marketing Consent Checkbox (UNCHECKED BY DEFAULT) */}
              <div className="pt-3 border-t border-neutral-100">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('marketingConsent')}
                    className="w-4 h-4 rounded border-neutral-300 text-emerald-950 focus:ring-emerald-800 mt-0.5"
                  />
                  <span className="text-xs text-neutral-600 leading-normal">
                    Keep me updated on exclusive lawn arrivals, private leather sales & order updates via WhatsApp & Email. (Uncheck anytime)
                  </span>
                </label>
              </div>

            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="font-serif text-lg font-bold text-neutral-900">
                  Payment Method
                </h2>
              </div>

              {/* COD Option (Active) */}
              <label className="relative flex items-start gap-4 p-4 rounded-2xl border-2 border-emerald-900 bg-emerald-50/40 cursor-pointer transition-all">
                <input
                  type="radio"
                  value="COD"
                  defaultChecked
                  {...register('paymentMethod')}
                  className="mt-1 text-emerald-950 focus:ring-emerald-900 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-neutral-900">
                    <Banknote className="w-4 h-4 text-emerald-900" />
                    Cash on Delivery (COD)
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">
                    Pay with physical cash when the courier rider delivers the parcel to your doorstep. Available across Pakistan.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Recommended
                </span>
              </label>

              {/* Coming soon payments */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Coming Soon (Online Gateways):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 opacity-60 flex items-center gap-2.5 text-neutral-500">
                    <CreditCard className="w-4 h-4" />
                    <span>Credit / Debit Card (Visa/MC)</span>
                  </div>
                  <div className="p-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/60 opacity-60 flex items-center gap-2.5 text-neutral-500">
                    <Building2 className="w-4 h-4" />
                    <span>JazzCash / EasyPaisa / 1LINK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm sticky top-28 space-y-6">
              <h2 className="font-serif text-lg font-bold text-neutral-900 pb-3 border-b border-neutral-100">
                Your Order ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h2>

              {/* Items List Preview */}
              <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 pr-1 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        loader={cloudinaryLoader}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-0 right-0 z-10 bg-neutral-800 text-white text-[10px] font-bold px-1 rounded-bl">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-neutral-900 truncate">{item.name}</h4>
                      <p className="text-[11px] text-neutral-500">
                        {item.size ? `Size: ${item.size}` : ''} {item.color ? `• ${item.color}` : ''}
                      </p>
                      <p className="text-xs font-bold text-neutral-900 mt-0.5">
                        {formatPKR(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              {(() => {
                const honest = calculateHonestTotal(subtotal, watch('paymentMethod') || 'COD', settings);
                return (
                  <>
                    <div className="space-y-2 pt-3 border-t border-neutral-100 text-sm">
                      <div className="flex justify-between text-neutral-600 text-xs">
                        <span>Subtotal</span>
                        <span className="font-medium text-neutral-900">{formatPKR(honest.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 text-xs">
                        <span>Nationwide Courier Fee</span>
                        <span>
                          {honest.shippingCharge === 0 ? (
                            <span className="text-emerald-700 font-bold uppercase text-xs">FREE</span>
                          ) : (
                            formatPKR(honest.shippingCharge)
                          )}
                        </span>
                      </div>
                      {honest.codHandlingFee > 0 && (
                        <div className="flex justify-between text-neutral-600 text-xs">
                          <span>COD Handling Charge</span>
                          <span className="font-medium text-neutral-900">{formatPKR(honest.codHandlingFee)}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline">
                        <div>
                          <span className="text-base font-bold text-neutral-900">Total Payable</span>
                          <p className="text-[10px] text-neutral-500">
                            {honest.isAdvanceRequired ? 'Advance Deposit + Balance COD' : 'Cash on Delivery'}
                          </p>
                        </div>
                        <span className="font-serif text-2xl font-bold text-emerald-950">
                          {formatPKR(honest.grandTotal)}
                        </span>
                      </div>

                      {honest.isAdvanceRequired && (
                        <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                          <div className="flex justify-between font-bold text-amber-900">
                            <span>Advance Deposit:</span>
                            <span>{formatPKR(honest.advanceRequiredAmount)}</span>
                          </div>
                          <div className="flex justify-between text-neutral-600">
                            <span>Balance Due on Delivery:</span>
                            <span className="font-bold">{formatPKR(honest.codPayableOnDelivery)}</span>
                          </div>
                          <p className="text-[10px] text-amber-800 pt-1 border-t border-amber-200">
                            {settings.advancePayment.accountDetails}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      className="w-full font-bold shadow-md bg-emerald-950 hover:bg-emerald-900 py-3.5 text-sm mt-3"
                    >
                      {isSubmitting ? 'Confirming Order...' : `Confirm Order (${formatPKR(honest.grandTotal)})`}
                    </Button>

                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-600 space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        {honest.isAdvanceRequired ? 'Partial Advance Deposit' : 'No Upfront Payment Required'}
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        {settings.allowOpenParcel
                          ? 'Courier Open Parcel: You are authorized to inspect the flyer contents before making payment.'
                          : 'Standard Courier Terms: Courier rider collects COD cash before opening flyer. Covered by our 7-day hassle-free exchange guarantee.'}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
