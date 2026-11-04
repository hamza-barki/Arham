'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingDown,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Building2,
  DollarSign,
  ShieldAlert,
  ArrowUpDown,
  Download,
  Info,
} from 'lucide-react';
import { getRtoReportAction, RtoReportData } from '@/app/actions/admin-reports';
import { formatPKR } from '@/lib/utils';

export default function AdminRtoReportPage() {
  const [data, setData] = useState<RtoReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'city' | 'product'>('city');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getRtoReportAction();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load RTO report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getRateBadge = (rate: number) => {
    if (rate >= 25) return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    if (rate >= 15) return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-600" />
            RTO Analytics & City Return Rates
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Monitor failed Cash on Delivery parcels, return charges, and high-risk destinations across Pakistan.
          </p>
        </div>

        <button
          onClick={fetchReport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-xs transition shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Overall RTO Rate</span>
          <div className="text-2xl font-black text-rose-600 mt-1 flex items-baseline gap-2">
            <span>{data?.overallRtoRate ?? 0}%</span>
            <span className="text-[10px] text-neutral-400 font-normal">of shipments</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">
            Target benchmark: &lt; 12%
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Returned Consignments</span>
          <div className="text-2xl font-black text-neutral-900 mt-1">
            {data?.totalRto ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">
            Out of {data?.totalShipped ?? 0} total dispatched
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Delivered Successfully</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {data?.totalDelivered ?? 0}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            {data?.totalShipped ? Math.round(((data.totalDelivered) / data.totalShipped) * 100) : 0}% delivery success
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
          <span className="text-xs text-neutral-500 font-medium">Estimated Courier Loss</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {formatPKR(data?.estimatedLossPkr ?? 0)}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">
            Based on Rs. 200 return fee/parcel
          </div>
        </div>
      </div>

      {/* Strategic Loss-Prevention Advice */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 flex items-start gap-3.5 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm text-amber-900">Pakistani Dropshipper Return Guidelines:</span>
          <ul className="list-disc list-inside space-y-1 text-amber-800 leading-relaxed">
            <li>
              <strong>Cities with &gt; 25% RTO (e.g. Peshawar, Faisalabad):</strong> Enable the <em>Advance Payment Rule</em> in COD Settings to request Rs. 500 via JazzCash before shipping.
            </li>
            <li>
              <strong>Size & Fitting Mismatch:</strong> Khussas and stitched suits have higher return rates. Confirm exact bust, length, or foot CM with the customer before dispatch.
            </li>
            <li>
              <strong>Doorstep Rejections:</strong> 72% of RTOs in Pakistan happen because riders attempt delivery without calling first. Use our courier CSV export with contact numbers clearly visible.
            </li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('city')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition flex items-center gap-2 ${
            activeTab === 'city'
              ? 'bg-white border-t border-x border-neutral-200 text-emerald-950 shadow-2xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-800" />
          <span>RTO Breakdown by Pakistani City</span>
        </button>

        <button
          onClick={() => setActiveTab('product')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition flex items-center gap-2 ${
            activeTab === 'product'
              ? 'bg-white border-t border-x border-neutral-200 text-emerald-950 shadow-2xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-800" />
          <span>RTO Breakdown by Product / SKU</span>
        </button>
      </div>

      {/* City Table */}
      {activeTab === 'city' && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">
              City Return Ranking (Highest Risk to Lowest)
            </h2>
            <span className="text-xs text-neutral-400">
              {data?.byCity.length || 0} cities monitored
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/75 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4 text-center">Total Dispatched</th>
                  <th className="py-3 px-4 text-center">Delivered</th>
                  <th className="py-3 px-4 text-center">Returned (RTO)</th>
                  <th className="py-3 px-4 text-center">RTO Rate %</th>
                  <th className="py-3 px-4 text-right">Lost Courier Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(data?.byCity || []).map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 transition">
                    <td className="py-3 px-4 font-bold text-neutral-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{row.city}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-neutral-700">
                      {row.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold">
                      {row.deliveredCount}
                    </td>
                    <td className="py-3 px-4 text-center text-rose-600 font-bold">
                      {row.rtoCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getRateBadge(row.rtoRate)}`}>
                        {row.rtoRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-800">
                      {formatPKR(row.courierLossPkr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Table */}
      {activeTab === 'product' && (
        <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">
              Product SKU Return Frequency
            </h2>
            <span className="text-xs text-neutral-400">
              Track return spikes on specific fabrics or shoe sizes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/75 text-neutral-600 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Markaz SKU</th>
                  <th className="py-3 px-4 text-center">Dispatched</th>
                  <th className="py-3 px-4 text-center">Delivered</th>
                  <th className="py-3 px-4 text-center">Returned (RTO)</th>
                  <th className="py-3 px-4 text-right">RTO Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(data?.byProduct || []).map((prod, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 transition">
                    <td className="py-3 px-4 font-bold text-neutral-900 max-w-xs truncate">
                      {prod.productName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {prod.supplierSku}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-neutral-700">
                      {prod.totalShipped}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-700 font-semibold">
                      {prod.deliveredCount}
                    </td>
                    <td className="py-3 px-4 text-center text-rose-600 font-bold">
                      {prod.rtoCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getRateBadge(prod.rtoRate)}`}>
                        {prod.rtoRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

