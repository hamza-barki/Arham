'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  Banknote,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Package,
  MapPin,
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getDashboardMetricsAction, DashboardMetrics } from '@/app/actions/admin-dashboard';
import { formatPKR } from '@/lib/utils';
import { ORDER_STATUS_LABELS, OrderStatusV2 } from '@/types';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await getDashboardMetricsAction();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getStatusColor = (st: OrderStatusV2) => {
    switch (st) {
      case 'pending_confirmation': return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'ordered_from_supplier': return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'shipped': return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'returned_rto': return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'cancelled': return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Operations & Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Real-time Pakistani Cash on Delivery fulfillment, revenue, profit margins, and inventory metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-2xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Stats'}</span>
        </button>
      </div>

      {/* METRIC CARDS GRID (6 KEY METRICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. Today's Orders */}
        <Link
          href="/admin/orders?dateRange=today"
          className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs hover:border-emerald-700 transition space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Today (PKT)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-neutral-900">
              {metrics?.todayOrdersCount ?? '—'}
            </span>
            <span className="text-[11px] text-neutral-500">orders</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            Midnight - Now (PKT) &rarr;
          </span>
        </Link>

        {/* 2. Pending Confirmations */}
        <Link
          href="/admin/orders?status=pending_confirmation"
          className="bg-white rounded-2xl p-4 border border-amber-300/80 bg-amber-50/20 shadow-2xs hover:border-amber-500 transition space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Pending Call
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-amber-950">
              {metrics?.pendingConfirmationsCount ?? '—'}
            </span>
            <span className="text-[11px] text-amber-800">waiting</span>
          </div>
          <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
            Requires COD confirmation &rarr;
          </span>
        </Link>

        {/* 3. Realized Revenue (Delivered Orders Only) */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-300/80 bg-emerald-50/10 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
              Realized Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="truncate">
            <span className="text-xl sm:text-2xl font-serif font-bold text-emerald-950">
              {metrics ? formatPKR(metrics.realizedRevenue ?? metrics.totalRevenue) : '—'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 block font-medium">
            Delivered Orders Only (Cash Collected)
          </span>
        </div>

        {/* 4. Pipeline Revenue (In-Flight Orders) */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Pipeline (In-Flight)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="truncate">
            <span className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
              {metrics ? formatPKR(metrics.pipelineRevenue ?? 0) : '—'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Confirmed & In-Transit Orders
          </span>
        </div>

        {/* 5. Realized Net Profit (Delivered Only, Hidden from Staff) */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Realized Net Profit
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {metrics?.estimatedProfit !== null ? (
            <div>
              <span className="text-xl sm:text-2xl font-serif font-bold text-blue-950 block">
                {formatPKR(metrics?.realizedProfit ?? metrics?.estimatedProfit ?? 0)}
              </span>
              <span className="text-[10px] font-bold text-emerald-700">
                {metrics?.profitMarginPercent}% margin
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-neutral-400 py-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Manager+ Role</span>
            </div>
          )}
          <span className="text-[10px] text-neutral-400 block truncate">
            Delivered Orders Only (Net COGS)
          </span>
        </div>

        {/* 5. Return to Origin (RTO Rate) */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              RTO Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-rose-950">
              {metrics?.rtoRate ?? 0}%
            </span>
            <span className="text-[11px] text-neutral-400">
              ({metrics?.rtoCount ?? 0} returns)
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 block">
            Target: &lt; 8% in Pakistan COD
          </span>
        </div>

        {/* 6. Low Stock Alerts Count */}
        <Link
          href="/admin/products?lowStock=true"
          className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs hover:border-amber-500 transition space-y-2 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Low Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-serif font-bold text-neutral-900">
              {metrics?.lowStockItems?.length ?? 0}
            </span>
            <span className="text-[11px] text-neutral-500">items</span>
          </div>
          <span className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
            &le; 5 units remaining &rarr;
          </span>
        </Link>
      </div>

      {/* QUICK WORKFLOW SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          href="/admin/products/new"
          className="bg-emerald-950 text-amber-300 p-3.5 rounded-2xl shadow-xs hover:bg-emerald-900 border border-emerald-800 transition flex items-center justify-between col-span-2 sm:col-span-1"
        >
          <div className="space-y-0.5">
            <p className="font-bold text-xs text-amber-300">+ New Product</p>
            <p className="text-[10px] text-emerald-300">Publish catalog items</p>
          </div>
          <Package className="w-4 h-4 text-amber-300" />
        </Link>

        <Link
          href="/admin/orders?status=pending_confirmation"
          className="bg-emerald-900 text-white p-3.5 rounded-2xl shadow-xs hover:bg-emerald-800 transition flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <p className="font-bold text-xs">Confirm COD Orders</p>
            <p className="text-[10px] text-emerald-300">Call/WhatsApp verification</p>
          </div>
          <PhoneCall className="w-4 h-4 text-emerald-300" />
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-xs hover:border-emerald-700 transition flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <p className="font-bold text-xs text-neutral-900">Courier Booking</p>
            <p className="text-[10px] text-neutral-500">Export CSV for PostEx / Trax</p>
          </div>
          <ShoppingBag className="w-4 h-4 text-emerald-800" />
        </Link>

        <Link
          href="/admin/products/import"
          className="bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-xs hover:border-emerald-700 transition flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <p className="font-bold text-xs text-neutral-900">Markaz Excel Import</p>
            <p className="text-[10px] text-neutral-500">Upload catalog & ZIPs</p>
          </div>
          <Package className="w-4 h-4 text-emerald-800" />
        </Link>

        <Link
          href="/admin/areas"
          className="bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-xs hover:border-emerald-700 transition flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <p className="font-bold text-xs text-neutral-900">Area Review Queue</p>
            <p className="text-[10px] text-neutral-500">Unlisted customer zones</p>
          </div>
          <MapPin className="w-4 h-4 text-emerald-800" />
        </Link>
      </div>

      {/* TWO COLUMN SECTION: RECENT ORDERS & LOW STOCK ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Orders (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-neutral-900">
                Recent Orders Activity
              </h2>
              <p className="text-xs text-neutral-500">
                Latest customer placements nationwide
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-neutral-100">
            {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
              metrics.recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/60 rounded-xl px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-neutral-700 text-xs">
                      {ord.city.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="font-mono font-bold text-emerald-950 text-xs sm:text-sm hover:underline"
                        >
                          {ord.orderNumber}
                        </Link>
                        {ord.requiresAreaReview && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                            Unlisted Area
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600">
                        {ord.customerName} &bull; <span className="font-mono">{ord.phone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(
                        ord.status
                      )}`}
                    >
                      {ORDER_STATUS_LABELS[ord.status] || ord.status}
                    </span>
                    <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                      {formatPKR(ord.totalAmount)}
                    </span>
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="p-1.5 text-neutral-400 hover:text-emerald-800 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-neutral-500">
                No orders placed yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Low Stock Alerts & Top Cities (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-serif text-sm font-bold text-neutral-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Low Stock Alerts
              </h3>
              <span className="text-[10px] text-neutral-400 font-bold uppercase">
                &le; 5 units
              </span>
            </div>

            <div className="space-y-2.5">
              {metrics?.lowStockItems && metrics.lowStockItems.length > 0 ? (
                metrics.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {item.variantName || 'Standard'} &bull; SKU: {item.supplierSku || 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 shrink-0">
                      {item.stock} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-neutral-500">
                  All inventory healthy. Zero low-stock warnings.
                </p>
              )}
            </div>
          </div>

          {/* Top Demand Cities */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-3">
            <h3 className="font-serif text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              Top Logistics Hubs (By Volume)
            </h3>
            <div className="space-y-2">
              {metrics?.topCities?.map((c) => (
                <div key={c.city} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-semibold text-neutral-800">{c.city}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-900">{c.count} orders</span>
                    <span className="text-[10px] text-neutral-400 block">{formatPKR(c.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

