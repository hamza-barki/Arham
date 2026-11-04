'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  Mail,
  Phone,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  ShieldCheck,
  Bell,
  Sparkles,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatPKR } from '@/lib/utils';
import { PAKISTAN_CITIES, BRAND_NAME } from '@/lib/constants';
import { Address, OrderWithDetails, ORDER_STATUS_LABELS } from '@/types';

type ActiveTab = 'orders' | 'addresses' | 'profile';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, isLoading, signOut, updateProfile, toggleMarketingConsent } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Profile Edit State
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    province: 'Punjab',
    city: 'Lahore',
    addressLine: '',
    landmark: '',
    isDefault: false,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [isLoading, user, router]);

  // Sync inputs with profile
  useEffect(() => {
    if (profile) {
      setNameInput(profile.full_name || '');
      setPhoneInput(profile.phone || '');
    }
  }, [profile]);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);

    if (!isSupabaseConfigured()) {
      // Mock sample orders for demo
      setOrders([
        {
          id: 'ord-demo-1',
          order_number: 'PK-10028',
          status_v2: 'confirmed',
          total_amount: 4850,
          created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
          courier: 'Leopards Courier',
          tracking_number: 'LPD-98231451',
          city: 'Lahore',
          items: [
            { id: 'i1', product_name: 'Royal Emerald Embroidered Kurta', quantity: 1, price: 4850 },
          ],
        },
        {
          id: 'ord-demo-2',
          order_number: 'PK-10014',
          status_v2: 'delivered',
          total_amount: 8950,
          created_at: new Date(Date.now() - 3600 * 1000 * 240).toISOString(),
          courier: 'TCS Express',
          tracking_number: 'TCS-77123901',
          city: 'Karachi',
          items: [
            { id: 'i2', product_name: 'Signature Cognac Leather Everyday Tote', quantity: 1, price: 8950 },
          ],
        },
      ]);
      setLoadingOrders(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          status_v2,
          total_amount,
          created_at,
          courier,
          tracking_number,
          city,
          addr_city,
          order_items (
            id,
            quantity,
            price,
            product:products(name)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(
          data.map((o: any) => ({
            ...o,
            items: (o.order_items || []).map((item: any) => ({
              id: item.id,
              product_name: item.product?.name || 'Artisanal Piece',
              quantity: item.quantity,
              price: item.price,
            })),
          }))
        );
      }
    } catch (e) {
      console.warn('Failed to fetch orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  // Fetch Addresses
  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoadingAddresses(true);

    if (!isSupabaseConfigured()) {
      setAddresses([
        {
          id: 'addr-demo-1',
          user_id: user.id,
          full_name: profile?.full_name || 'Ayesha Khan',
          phone: profile?.phone || '03001234567',
          province: 'Punjab',
          city: 'Lahore',
          area_id: null,
          address_line: 'House 42-B, Sector Z, Phase 3, DHA',
          landmark: 'Near Y-Block Market',
          lat: null,
          lng: null,
          is_default: true,
          created_at: new Date().toISOString(),
        },
      ]);
      setLoadingAddresses(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (!error && data) {
        setAddresses(data as Address[]);
      }
    } catch (e) {
      console.warn('Failed to fetch addresses:', e);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchAddresses();
    }
  }, [user, fetchOrders, fetchAddresses]);

  // Save / Update Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isSupabaseConfigured()) {
      const newAddr: Address = {
        id: editingAddressId || 'addr-demo-' + Date.now(),
        user_id: user.id,
        full_name: addressForm.fullName,
        phone: addressForm.phone,
        province: addressForm.province,
        city: addressForm.city,
        area_id: null,
        address_line: addressForm.addressLine,
        landmark: addressForm.landmark || null,
        lat: null,
        lng: null,
        is_default: addressForm.isDefault,
        created_at: new Date().toISOString(),
      };
      setAddresses((prev) =>
        editingAddressId
          ? prev.map((a) => (a.id === editingAddressId ? newAddr : a))
          : [newAddr, ...prev]
      );
      setIsAddressModalOpen(false);
      return;
    }

    try {
      if (editingAddressId) {
        await (supabase as any)
          .from('addresses')
          .update({
            full_name: addressForm.fullName,
            phone: addressForm.phone,
            province: addressForm.province,
            city: addressForm.city,
            address_line: addressForm.addressLine,
            landmark: addressForm.landmark || null,
            is_default: addressForm.isDefault,
          })
          .eq('id', editingAddressId)
          .eq('user_id', user.id);
      } else {
        await (supabase as any).from('addresses').insert({
          user_id: user.id,
          full_name: addressForm.fullName,
          phone: addressForm.phone,
          province: addressForm.province,
          city: addressForm.city,
          address_line: addressForm.addressLine,
          landmark: addressForm.landmark || null,
          is_default: addressForm.isDefault,
        });
      }

      await fetchAddresses();
      setIsAddressModalOpen(false);
    } catch (e) {
      console.error('Failed to save address:', e);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    if (!isSupabaseConfigured()) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      return;
    }

    try {
      await (supabase as any).from('addresses').delete().eq('id', id).eq('user_id', user?.id);
      await fetchAddresses();
    } catch (e) {
      console.error('Failed to delete address:', e);
    }
  };

  // Set Address as Default
  const handleSetDefaultAddress = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
      return;
    }

    try {
      await (supabase as any)
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user?.id);

      await fetchAddresses();
    } catch (e) {
      console.error('Failed to set default address:', e);
    }
  };

  // Update Profile details
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    const res = await updateProfile(nameInput, phoneInput);
    setProfileLoading(false);
    if (res.success) {
      setProfileMsg('Profile information updated successfully!');
      setTimeout(() => setProfileMsg(null), 3500);
    }
  };

  // Open Address Modal for Edit
  const openEditAddressModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.full_name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      addressLine: addr.address_line,
      landmark: addr.landmark || '',
      isDefault: addr.is_default,
    });
    setIsAddressModalOpen(true);
  };

  // Open Address Modal for New
  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: profile?.full_name || '',
      phone: profile?.phone || '',
      province: 'Punjab',
      city: 'Lahore',
      addressLine: '',
      landmark: '',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="w-8 h-8 text-emerald-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Customer Header Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-neutral-900 text-white rounded-3xl p-6 sm:p-10 mb-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 text-2xl font-serif font-bold shadow-md">
              {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-300 font-bold block mb-1">
                Customer Account
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold">
                {profile?.full_name || 'Valued Customer'}
              </h1>
              <p className="text-xs text-emerald-200 mt-0.5">
                {user.email} {profile?.phone ? `• ${profile.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors"
            >
              My Shopping Bag
            </Link>
            <button
              onClick={() => signOut()}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/30 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-8 border-b border-neutral-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-emerald-950 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Order History ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'addresses'
                ? 'bg-emerald-950 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Saved Addresses ({addresses.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-emerald-950 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <User className="w-4 h-4" />
            Profile & Privacy
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {loadingOrders ? (
              <div className="p-12 text-center text-neutral-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center max-w-md mx-auto">
                <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-neutral-900 text-lg mb-1">
                  No orders recorded yet
                </h3>
                <p className="text-xs text-neutral-500 mb-6">
                  When you place an order, it will appear here with live courier tracking updates.
                </p>
                <Link
                  href="/products"
                  className="inline-flex px-6 py-2.5 rounded-xl bg-emerald-950 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-sm"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const statusLabel =
                  ORDER_STATUS_LABELS[order.status_v2 as keyof typeof ORDER_STATUS_LABELS] ||
                  order.status_v2 ||
                  order.status;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                          Order Number
                        </span>
                        <h3 className="font-mono text-xl font-bold text-neutral-900">
                          {order.order_number}
                        </h3>
                        <span className="text-xs text-neutral-500">
                          Placed on{' '}
                          {new Date(order.created_at).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                          {statusLabel}
                        </span>

                        <Link
                          href={`/orders/track?num=${order.order_number}`}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-emerald-950 transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Track Consignment
                        </Link>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="py-4 divide-y divide-neutral-50 text-xs">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between">
                          <span className="text-neutral-800 font-medium">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-mono font-semibold text-neutral-900">
                            {formatPKR(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Row */}
                    <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500">
                      <div>
                        {order.courier ? (
                          <span>
                            Handed over to <strong>{order.courier}</strong>
                            {order.tracking_number && ` (CN: ${order.tracking_number})`}
                          </span>
                        ) : (
                          <span>Awaiting courier handover</span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-neutral-900 font-mono">
                        Total: {formatPKR(order.total_amount)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutral-900">
                  Delivery Addresses
                </h2>
                <p className="text-xs text-neutral-500">
                  Save your home, office, or studio locations for instant 1-click checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={openNewAddressModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Address
              </button>
            </div>

            {loadingAddresses ? (
              <div className="p-12 text-center text-neutral-400">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center max-w-md mx-auto">
                <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-neutral-900 text-lg mb-1">
                  No saved addresses
                </h3>
                <p className="text-xs text-neutral-500 mb-6">
                  Add your primary delivery address to speed up future orders across Pakistan.
                </p>
                <button
                  type="button"
                  onClick={openNewAddressModal}
                  className="px-6 py-2.5 rounded-xl bg-emerald-950 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-sm"
                >
                  Add Your Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-3xl p-6 border transition-all ${
                      addr.is_default
                        ? 'border-emerald-800 ring-2 ring-emerald-800/10 shadow-md'
                        : 'border-neutral-200/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm text-neutral-900">
                        {addr.full_name}
                      </span>
                      {addr.is_default ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900">
                          Default
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] text-emerald-900 hover:underline font-medium"
                        >
                          Make Default
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed mb-1">
                      {addr.address_line}
                    </p>
                    {addr.landmark && (
                      <p className="text-xs text-neutral-400 italic mb-1">
                        Near: {addr.landmark}
                      </p>
                    )}
                    <p className="text-xs font-medium text-neutral-800 mb-2">
                      {addr.city}, {addr.province}
                    </p>
                    <p className="text-xs text-neutral-500 mb-4 font-mono">
                      Phone: {addr.phone}
                    </p>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => openEditAddressModal(addr)}
                        className="inline-flex items-center gap-1 text-neutral-700 hover:text-emerald-950 font-medium"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE & MARKETING CONSENT */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Profile Info Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-neutral-900 mb-1">
                Account Details
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Update your contact details used for Cash on Delivery confirmation.
              </p>

              {profileMsg && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm bg-neutral-100 text-neutral-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Contact care desk to update your verified primary email address.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Primary Phone (03XX)
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="03001234567"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-3 bg-emerald-950 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 transition-all shadow-sm disabled:opacity-50"
                >
                  {profileLoading ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </form>
            </div>

            {/* Marketing Consent & Privacy Controls */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Marketing Consent Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-neutral-900">
                      Marketing Communications
                    </h3>
                    <span className="text-[11px] text-neutral-400">
                      WhatsApp & Email Announcements
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                  Control whether you receive VIP invitations, new seasonal catalog drops, and limited flash sale coupons.
                </p>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">
                      Promotional Alerts
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {profile?.marketing_consent
                        ? `Subscribed (consented ${
                            profile.consent_at
                              ? new Date(profile.consent_at).toLocaleDateString()
                              : 'earlier'
                          })`
                        : 'Currently unsubscribed'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMarketingConsent(!profile?.marketing_consent)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      profile?.marketing_consent
                        ? 'bg-emerald-950 text-white shadow-sm'
                        : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                    }`}
                  >
                    {profile?.marketing_consent ? 'Subscribed' : 'Enable'}
                  </button>
                </div>
              </div>

              {/* Data Privacy info */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm text-xs text-neutral-600 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  Your Privacy is Protected
                </div>
                <p>
                  Per our strict RLS policies, only you have access to your personal delivery addresses and order timeline. We never trade customer information.
                </p>
                <Link
                  href="/privacy-policy"
                  className="text-emerald-900 font-semibold underline block pt-2"
                >
                  Read our complete Privacy Policy
                </Link>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Address Edit/Add Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl font-bold text-neutral-900 mb-1">
              {editingAddressId ? 'Edit Delivery Address' : 'Add New Address'}
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Enter your complete address for accurate delivery across Pakistan.
            </p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Recipient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="03001234567"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    Province
                  </label>
                  <select
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 bg-white"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Islamabad Capital">Islamabad Capital</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 bg-white"
                  >
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Complete Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="House/Plot #, Street #, Sector / Block / Area"
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Nearest Famous Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Jamia Mosque / Next to Shell Pump"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 text-emerald-950 focus:ring-emerald-800"
                  />
                  <span className="text-xs text-neutral-700 font-medium">
                    Set as default delivery address for checkout
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-950 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 transition-all shadow-sm"
                >
                  {editingAddressId ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
