'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  PhoneCall,
  Calendar,
  Building2,
  Truck,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getAdminOrdersAction,
  exportOrdersCourierCsvAction,
  AdminOrderItem,
} from '@/app/actions/admin-orders';
import { formatPKR } from '@/lib/utils';
import { ORDER_STATUS_LABELS, OrderStatusV2 } from '@/types';
import { STARTER_CITIES } from '@/lib/geo';

export default function AdminOrdersListPage() {
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams?.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState(searchParams?.get('dateRange') || 'all');
  const [cityFilter, setCityFilter] = useState('all');
  const [courierFilter, setCourierFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection for batch courier export
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await getAdminOrdersAction({
      status: statusFilter,
      dateRange: dateFilter,
      city: cityFilter,
      courier: courierFilter,
      search: searchQuery,
    });

    if (res.success) {
      setOrders(res.orders);
      setTotalCount(res.total);
    }
    setLoading(false);
  }, [statusFilter, dateFilter, cityFilter, courierFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle select all toggle
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(orders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export selected orders to Courier CSV (PostEx / Trax / Leopards format)
  const handleExportCourierCsv = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one order to export for courier booking.');
      return;
    }
    setExporting(true);
    const res = await exportOrdersCourierCsvAction(selectedIds);
    setExporting(false);

    if (res.success && res.csvContent) {
      const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename || 'courier_booking.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Export error: ${res.error}`);
    }
  };

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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-800" />
            Orders Management & Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
            Filter, verify COD details, update fulfillment tracking, and export courier booking files.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCourierCsv}
            disabled={exporting || selectedIds.length === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
              selectedIds.length > 0
                ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>
              {exporting
                ? 'Generating CSV...'
                : `Export Courier CSV (${selectedIds.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 bg-white border border-neutral-300 rounded-xl text-neutral-600 hover:text-neutral-900"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS GRID */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phone or order #..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">All Statuses</option>
            <option value="pending_confirmation">Pending Confirmation (Call Needed)</option>
            <option value="confirmed">Confirmed (Ready to Order)</option>
            <option value="ordered_from_supplier">Ordered from Supplier (Markaz)</option>
            <option value="shipped">Shipped with Courier</option>
            <option value="delivered">Delivered & Cash Collected</option>
            <option value="returned_rto">Returned (RTO)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">Past 7 Days</option>
          </select>
        </div>

        {/* City Filter */}
        <div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">All Cities</option>
            {STARTER_CITIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} {c.courierCityCode ? `[${c.courierCityCode}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Courier Filter */}
        <div>
          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
          >
            <option value="all">All Couriers</option>
            <option value="PostEx">PostEx</option>
            <option value="Leopards">Leopards Courier</option>
            <option value="TCS">TCS</option>
            <option value="Trax">Trax Logistics</option>
          </select>
        </div>

      </div>

      {/* ORDERS LIST: TABLE ON DESKTOP, CARDS ON MOBILE */}
      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
        
        {/* Table View (Desktop & Tablet) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-emerald-800 focus:ring-emerald-800"
                  />
                </th>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer & Phone</th>
                <th className="py-3 px-4">Location (City & Area)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Courier / Tracking</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ord.id)}
                        onChange={() => handleToggleSelectOne(ord.id)}
                        className="rounded text-emerald-800 focus:ring-emerald-800"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="font-mono font-bold text-emerald-950 hover:underline block"
                      >
                        {ord.orderNumber}
                      </Link>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-900">{ord.customerName}</p>
                      <a
                        href={`tel:${ord.phone}`}
                        className="font-mono text-neutral-500 hover:text-emerald-800 text-[11px] block"
                      >
                        {ord.phone}
                      </a>
                      {/* Risk Flag Badges */}
                      {ord.riskFlags?.flags && ord.riskFlags.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ord.riskFlags.flags.map((flag, fIdx) => (
                            <span
                              key={fIdx}
                              title={flag.description}
                              className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                flag.severity === 'high'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {flag.severity === 'high' && <AlertTriangle className="w-2.5 h-2.5" />}
                              <span>{flag.label}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-800">{ord.city}</span>
                        {ord.requiresAreaReview && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                            Unlisted
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-500 block text-[11px] truncate max-w-xs">
                        {ord.areaName || ord.addressLine || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getStatusColor(
                          ord.status
                        )}`}
                      >
                        {ORDER_STATUS_LABELS[ord.status] || ord.status}
                      </span>
                      {ord.status === 'pending_confirmation' && (
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition"
                        >
                          <PhoneCall className="w-2.5 h-2.5 text-amber-600" />
                          <span>Confirm via WA/Call</span>
                        </Link>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {ord.courier ? (
                        <div>
                          <span className="font-semibold text-neutral-800">{ord.courier}</span>
                          {ord.trackingNumber && (
                            <span className="font-mono text-[10px] text-neutral-500 block">
                              {ord.trackingNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-neutral-400 italic">Not booked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {formatPKR(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Phones) */}
        <div className="md:hidden divide-y divide-neutral-100">
          {loading ? (
            <p className="p-8 text-center text-xs text-neutral-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="p-8 text-center text-xs text-neutral-500">No orders found.</p>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(ord.id)}
                      onChange={() => handleToggleSelectOne(ord.id)}
                      className="rounded text-emerald-800"
                    />
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="font-mono font-bold text-emerald-950 text-sm hover:underline"
                    >
                      {ord.orderNumber}
                    </Link>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusColor(
                      ord.status
                    )}`}
                  >
                    {ORDER_STATUS_LABELS[ord.status] || ord.status}
                  </span>
                </div>

                <div className="flex justify-between items-start text-xs">
                  <div>
                    <p className="font-bold text-neutral-900">{ord.customerName}</p>
                    <p className="font-mono text-neutral-500">{ord.phone}</p>
                    <p className="text-neutral-600 mt-0.5">
                      📍 {ord.areaName || ord.city}, {ord.city}
                    </p>
                  </div>
                  <span className="font-bold text-neutral-900 text-sm">
                    {formatPKR(ord.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <span className="text-neutral-500 text-[11px]">
                    {ord.courier ? `${ord.courier} (${ord.trackingNumber || 'Pending'})` : 'No Courier Booked'}
                  </span>
                  <Link
                    href={`/admin/orders/${ord.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg text-xs"
                  >
                    Manage & Call &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Showing {orders.length} of {totalCount} orders</span>
          <span>{selectedIds.length} orders selected</span>
        </div>

      </div>

    </div>
  );
}

