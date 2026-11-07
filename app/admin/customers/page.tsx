'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import {
  getAdminCustomersAction,
  exportConsentedCustomersCsvAction,
  AdminCustomerItem,
} from '@/app/actions/admin-customers';
import { useAdminRole } from '@/hooks/useAdminRole';

export default function AdminCustomersPage() {
  const { role } = useAdminRole();
  const isManagerOrAbove = role === 'manager' || role === 'admin' || role === 'super_admin';

  const [customers, setCustomers] = useState<AdminCustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [consentOnly, setConsentOnly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (searchQuery = search, consent = consentOnly) => {
    setLoading(true);
    try {
      const res = await getAdminCustomersAction({
        search: searchQuery,
        consentOnly: consent,
      });
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  }, [search, consentOnly]);

  useEffect(() => {
    fetchCustomers(search, consentOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleExportConsentedCsv = async () => {
    setExporting(true);
    setExportNotice(null);
    try {
      const res = await exportConsentedCustomersCsvAction();
      if (res.success && res.csvContent && res.filename) {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportNotice(`Exported ${res.count} opted-in customers to CSV!`);
      } else {
        alert(res.error || 'Failed to export CSV');
      }
    } catch (err: any) {
      alert(err.message || 'Export error');
    } finally {
      setExporting(false);
    }
  };

  // Metrics
  const totalCustomers = customers.length;
  const consentedCount = customers.filter((c) => c.marketingConsent).length;
  const consentPct = totalCustomers > 0 ? Math.round((consentedCount / totalCustomers) * 100) : 0;
  const totalSpentAll = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const repeatCustomers = customers.filter((c) => c.orderCount > 1).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-800" />
            Customers & Marketing
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Customer lifetime value, Pakistan mobile phone contacts, and GDPR/opt-in marketing broadcast exports.
          </p>
        </div>

        {isManagerOrAbove && (
          <button
            onClick={handleExportConsentedCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Consented CSV</span>
          </button>
        )}
      </div>

      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {exportNotice}
          </span>
          <button onClick={() => setExportNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-neutral-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Total Customers</div>
            <div className="text-base sm:text-lg font-black text-neutral-900">{totalCustomers}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Marketing Opted-In</div>
            <div className="text-base sm:text-lg font-black text-emerald-800">
              {consentedCount}{' '}
              <span className="text-xs text-emerald-600 font-semibold">({consentPct}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Repeat Buyers</div>
            <div className="text-base sm:text-lg font-black text-amber-700">{repeatCustomers}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-500">Total Revenue</div>
            <div className="text-base sm:text-lg font-black text-indigo-900">
              Rs. {totalSpentAll.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name, phone number (03xx), city, or email..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-emerald-800 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-black transition shrink-0"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => fetchCustomers()}
            title="Refresh Customers"
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Marketing Consent Filter Pill */}
          <button
            type="button"
            onClick={() => setConsentOnly(!consentOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              consentOnly
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Opted-In for Marketing Only</span>
          </button>

          {(search || consentOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setConsentOnly(false);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-2xl border border-neutral-200 animate-pulse flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-neutral-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/4" />
                <div className="h-3 bg-neutral-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">No customers found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search query or reset the marketing filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => {
            const rawPhone = customer.phone.replace(/\D/g, '');
            const waNumber = rawPhone.startsWith('92')
              ? rawPhone
              : rawPhone.startsWith('0')
              ? '92' + rawPhone.slice(1)
              : '92' + rawPhone;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-neutral-200/90 hover:border-emerald-200 hover:shadow-xs transition p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Avatar & Personal Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                    {customer.fullName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-black text-neutral-900 truncate">
                        {customer.fullName}
                      </h3>

                      {customer.marketingConsent ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Marketing Opted-In
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 text-[10px] font-medium flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-neutral-400" />
                          No Consent
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                      <span className="flex items-center gap-1 text-neutral-700 font-semibold">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {customer.city}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-neutral-800">{customer.phone}</span>
                      {customer.email && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[180px]">{customer.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center / Orders & Spend */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-neutral-500 font-medium">Orders Count</div>
                    <div className="text-sm sm:text-base font-black text-neutral-900">
                      {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-neutral-500 font-medium">Lifetime Spent</div>
                    <div className="text-sm sm:text-base font-black text-emerald-800">
                      Rs. {customer.totalSpent.toLocaleString()}
                    </div>
                  </div>

                  {/* Quick Contact Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${customer.phone}`}
                      title={`Call ${customer.fullName}`}
                      className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:text-emerald-800 hover:border-emerald-300 transition"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <a
                      href={`https://wa.me/${waNumber}?text=Assalam%20o%20Alaikum%20${encodeURIComponent(
                        customer.fullName
                      )},`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp Customer"
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

