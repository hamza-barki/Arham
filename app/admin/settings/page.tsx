'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  Truck,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Lock,
  Loader2,
  Info,
} from 'lucide-react';
import {
  getStoreSettingsAction,
  updateStoreSettingsAction,
  getBlockedEntitiesAction,
  addBlockedEntityAction,
  removeBlockedEntityAction,
} from '@/app/actions/admin-settings';
import { StoreSettings, DEFAULT_STORE_SETTINGS } from '@/lib/settings';
import { BlockedEntityRecord } from '@/lib/risk-engine';
import { useAdminRole } from '@/hooks/useAdminRole';

export default function AdminSettingsPage() {
  const { role } = useAdminRole();
  const isAdminOrSuper = role === 'admin' || role === 'super_admin';

  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [blockedList, setBlockedList] = useState<BlockedEntityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Blocklist modal / inputs
  const [blockType, setBlockType] = useState<'phone' | 'address'>('phone');
  const [blockValue, setBlockValue] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [addingBlock, setAddingBlock] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, blockRes] = await Promise.all([
        getStoreSettingsAction(),
        getBlockedEntitiesAction(),
      ]);

      if (settingsRes.success) setSettings(settingsRes.settings);
      if (blockRes.success) setBlockedList(blockRes.blockedList);
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrSuper) {
      alert('Only Admins and Super Admins can update store financial parameters.');
      return;
    }

    setSavingSettings(true);
    setNotice(null);

    try {
      const res = await updateStoreSettingsAction(settings);
      if (res.success) {
        setNotice('Store settings and COD controls saved successfully!');
      } else {
        alert(res.error || 'Failed to save settings');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockValue.trim() || !blockReason.trim()) return;

    setAddingBlock(true);
    try {
      const res = await addBlockedEntityAction({
        type: blockType,
        value: blockValue.trim(),
        reason: blockReason.trim(),
      });

      if (res.success) {
        setBlockValue('');
        setBlockReason('');
        loadData();
      } else {
        alert(res.error || 'Failed to add blocked entity');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding block');
    } finally {
      setAddingBlock(false);
    }
  };

  const handleRemoveBlock = async (id: string) => {
    if (!confirm('Are you sure you want to unblock this entity?')) return;
    try {
      const res = await removeBlockedEntityAction(id);
      if (res.success) {
        setBlockedList((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(res.error || 'Failed to remove block');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing block');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-emerald-800" />
          Store Settings & COD Controls
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Configure shipping charges, COD fees, open-parcel delivery policies, advance deposit rules, and fraud blacklists.
        </p>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} className="text-emerald-700 hover:text-emerald-950">
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-800 mb-2" />
          <p className="text-xs text-neutral-500 font-bold">Loading store parameters...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* SECTION 1: SHIPPING & COD CHARGES */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Shipping & Cash on Delivery (COD) Fees
                </h2>
                <p className="text-xs text-neutral-500">
                  Displayed transparently to customers during checkout as an honest total.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Free Shipping Threshold (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={settings.freeShippingThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        freeShippingThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-sm text-neutral-900 focus:outline-emerald-800"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Orders equal or above this get free courier delivery.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Standard Shipping Fee (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={settings.shippingFee}
                    onChange={(e) =>
                      setSettings({ ...settings, shippingFee: Number(e.target.value) })
                    }
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-sm text-neutral-900 focus:outline-emerald-800"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Charged for orders below the free shipping threshold.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  COD Handling Fee (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={settings.codFee}
                    onChange={(e) =>
                      setSettings({ ...settings, codFee: Number(e.target.value) })
                    }
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-sm text-neutral-900 focus:outline-emerald-800"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Courier cash handling charge (set to 0 for free COD).
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: OPEN PARCEL / INSPECT BEFORE PAYMENT CONTROL */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Allow Parcel Inspection Before Payment (Flyer Open)
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Controls whether customers are promised doorstep flyer inspection before paying the rider.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowOpenParcel}
                  onChange={(e) =>
                    setSettings({ ...settings, allowOpenParcel: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
              </label>
            </div>

            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                settings.allowOpenParcel
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Important Pakistan Logistics Rule:</strong>{' '}
                  {settings.allowOpenParcel ? (
                    <span>
                      You have enabled <strong>Open Parcel Inspection</strong>. Ensure your contracted courier account (PostEx/Trax/Leopards) specifically has the <em>&ldquo;Flyer Open Authorized&rdquo;</em> feature active on your merchant booking portal, otherwise courier delivery riders will refuse inspection at the doorstep.
                    </span>
                  ) : (
                    <span>
                      Standard courier policy is active: Customers hand COD payment to the rider before opening the security flyer. All orders remain 100% protected by our 7-day hassle-free exchange guarantee.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ADVANCE PAYMENT RULE (HIGH-VALUE COD ORDERS) */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Advance Deposit Rule for High-Value Orders
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Helps prevent costly fake/casual orders by requiring a small advance deposit (e.g. Rs. 500) for orders above a set threshold.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.advancePayment.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      advancePayment: {
                        ...settings.advancePayment,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
              </label>
            </div>

            {settings.advancePayment.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Apply Advance When Order Value Exceeds (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={settings.advancePayment.thresholdAmount}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          advancePayment: {
                            ...settings.advancePayment,
                            thresholdAmount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-sm text-neutral-900 focus:outline-emerald-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Advance Deposit Required (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={settings.advancePayment.advanceAmount}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          advancePayment: {
                            ...settings.advancePayment,
                            advanceAmount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 font-bold text-sm text-neutral-900 focus:outline-emerald-800"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Payment Instructions & Accounts (JazzCash / EasyPaisa / Bank)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.advancePayment.accountDetails}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        advancePayment: {
                          ...settings.advancePayment,
                          accountDetails: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-emerald-800"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Displayed to customers on checkout when an advance deposit is required.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SAVE BUTTON */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save COD & Store Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 4: ADMIN-MANAGED BLOCKLIST (BLACKLIST) */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Admin-Managed Blocklist (Fraud & Doorstep Refusals)
            </h2>
            <p className="text-xs text-neutral-500">
              Orders matching these phone numbers or street addresses will automatically trigger a <strong>High Risk Flag</strong>.
            </p>
          </div>
        </div>

        {/* Add Entry Form */}
        <form onSubmit={handleAddBlock} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/70 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                Block Type
              </label>
              <select
                value={blockType}
                onChange={(e) => setBlockType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-800 bg-white"
              >
                <option value="phone">Phone Number</option>
                <option value="address">Street / Address</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                Value to Block
              </label>
              <input
                type="text"
                required
                placeholder={blockType === 'phone' ? '03001234567' : 'Fake Address Sector'}
                value={blockValue}
                onChange={(e) => setBlockValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 3 consecutive doorstep refusals"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={addingBlock}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition shadow-xs"
              >
                {addingBlock ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Block</span>
              </button>
            </div>
          </div>
        </form>

        {/* Blocked Entities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100/75 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Target Value</th>
                <th className="py-2.5 px-3">Reason for Blacklist</th>
                <th className="py-2.5 px-3">Date Added</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {blockedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-400">
                    No blacklisted phones or addresses.
                  </td>
                </tr>
              ) : (
                blockedList.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 transition">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">
                      {item.value}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600">{item.reason}</td>
                    <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Unblock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

