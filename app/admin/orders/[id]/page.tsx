'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  Layers,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  getAdminOrderDetailAction,
  updateOrderStatusAction,
  updateOrderFulfillmentAction,
  AdminOrderDetailFull,
} from '@/app/actions/admin-orders';
import { formatPKR } from '@/lib/utils';
import { ORDER_STATUS_LABELS, OrderStatusV2 } from '@/types';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<AdminOrderDetailFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusV2>('pending_confirmation');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fulfillment tracking state
  const [fulfillment, setFulfillment] = useState({
    supplierOrderRef: '',
    courier: 'PostEx',
    trackingNumber: '',
    internalNotes: '',
  });
  const [isSavingFulfillment, setIsSavingFulfillment] = useState(false);

  // Copy feedback
  const [copiedMarkaz, setCopiedMarkaz] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    const res = await getAdminOrderDetailAction(orderId);
    if (res.success && res.order) {
      setOrder(res.order);
      setSelectedStatus(res.order.status);
      setFulfillment({
        supplierOrderRef: res.order.supplierOrderRef || '',
        courier: res.order.courier || 'PostEx',
        trackingNumber: res.order.trackingNumber || '',
        internalNotes: res.order.internalNotes || '',
      });
    } else {
      setError(res.error || 'Order not found');
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Handle status update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsUpdatingStatus(true);
    const res = await updateOrderStatusAction(order.id, selectedStatus, statusNote);
    setIsUpdatingStatus(false);
    if (res.success) {
      setStatusNote('');
      fetchOrder();
    } else {
      alert(`Status update error: ${res.error}`);
    }
  };

  // Quick confirm pending order
  const handleQuickConfirm = async () => {
    if (!order) return;
    setIsUpdatingStatus(true);
    const res = await updateOrderStatusAction(order.id, 'confirmed', 'Confirmed via WhatsApp / Call verification.');
    setIsUpdatingStatus(false);
    if (res.success) {
      fetchOrder();
    } else {
      alert(`Status update error: ${res.error}`);
    }
  };

  // Handle fulfillment save
  const handleFulfillmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSavingFulfillment(true);
    const res = await updateOrderFulfillmentAction(order.id, fulfillment);
    setIsSavingFulfillment(false);
    if (res.success) {
      alert('✓ Fulfillment & tracking details saved successfully.');
      fetchOrder();
    } else {
      alert(`Fulfillment save error: ${res.error}`);
    }
  };

  // Copy Markaz Supplier Order Details to Clipboard
  const handleCopyMarkazText = () => {
    if (!order?.markazOrderText) return;
    navigator.clipboard.writeText(order.markazOrderText);
    setCopiedMarkaz(true);
    setTimeout(() => setCopiedMarkaz(false), 2500);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-neutral-500">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-rose-600 font-bold">{error || 'Order not found'}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders List</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl sm:text-2xl font-bold text-emerald-950">
                {order.orderNumber}
              </h1>
              <span className="text-xs font-mono font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
                {order.paymentMethod}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div>
          <span className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            Current: {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* BIG CALL & WHATSAPP ACTION BUTTONS (MOBILE-FIRST COD CONFIRMATION) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Call Button */}
        <a
          href={order.callUrl}
          className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition active:scale-[0.98]"
        >
          <Phone className="w-5 h-5 text-emerald-300" />
          <span>Call Customer ({order.phone})</span>
        </a>

        {/* WhatsApp Button */}
        <a
          href={order.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition active:scale-[0.98]"
        >
          <MessageCircle className="w-5 h-5 text-emerald-200" />
          <span>WhatsApp Confirmation Message</span>
        </a>
      </div>

      {/* QUICK VERIFY & MARK CONFIRMED ACTION (IF PENDING) */}
      {order.status === 'pending_confirmation' && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 text-sm">Order Verification Pending</p>
              <p className="text-amber-800 mt-0.5">
                Call or WhatsApp customer to confirm their address and intent to receive. Do not order from Markaz until confirmed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickConfirm}
            disabled={isUpdatingStatus}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Mark as Confirmed</span>
          </button>
        </div>
      )}

      {/* RISK ASSESSMENT & FRAUD CONTROLS BANNER */}
      {order.riskFlags?.flags && order.riskFlags.flags.length > 0 && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-start gap-3 text-xs ${(order.riskFlags.riskLevel || 'medium') === 'high'
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${(order.riskFlags.riskLevel || 'medium') === 'high' ? 'text-rose-600' : 'text-amber-600'
              }`}
          />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-sm uppercase tracking-wide">
                COD Risk Assessment: {(order.riskFlags.riskLevel || 'medium').toUpperCase()} RISK (Score: {order.riskFlags.riskScore ?? 0})
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border">
                {order.riskFlags.flags.length} Flag{order.riskFlags.flags.length !== 1 ? 's' : ''} Triggered
              </span>
            </div>
            <ul className="space-y-1 mt-1">
              {order.riskFlags.flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold">&bull; {flag.label}:</span>
                  <span>{flag.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Unlisted Area Warning if flagged */}
      {order.requiresAreaReview && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-sm">Customer Unlisted Area Alert</p>
            <p>
              The customer selected <em>&ldquo;My area is not listed&rdquo;</em> and manually entered:{' '}
              <strong className="underline">{order.areaName}</strong>. Please confirm with the rider or customer before booking courier delivery.
            </p>
          </div>
        </div>
      )}

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (7 cols): Address, Items & Markaz Copy */}
        <div className="lg:col-span-7 space-y-6">

          {/* Customer & Address Snapshot Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-800" />
                Customer & Delivery Address
              </h2>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {order.city}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Recipient</span>
                <span className="font-bold text-neutral-900 text-sm">{order.customerName}</span>
              </div>

              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                <span className="font-mono font-bold text-neutral-900 text-sm">{order.phone}</span>
              </div>

              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Province & City</span>
                <span className="font-semibold text-neutral-800">
                  {order.province || 'Punjab'} &bull; {order.city}
                </span>
              </div>

              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Area / Sector</span>
                <span className="font-semibold text-neutral-800">{order.areaName || '—'}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-neutral-400 block text-[10px] uppercase font-bold">Street Address</span>
                <p className="font-semibold text-neutral-900 mt-0.5 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/80">
                  {order.addressLine || '—'}
                </p>
              </div>

              {order.landmark && (
                <div className="sm:col-span-2">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Nearby Landmark</span>
                  <p className="font-medium text-neutral-700 mt-0.5 italic">
                    Near: {order.landmark}
                  </p>
                </div>
              )}
            </div>

            {/* Map Pin Link (Leaflet / Google Maps) */}
            <div className="pt-2 border-t border-neutral-100">
              {order.mapPinUrl ? (
                <a
                  href={order.mapPinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                >
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Open Doorstep Location in Google Maps ({order.lat?.toFixed(4)}, {order.lng?.toFixed(4)})</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              ) : (
                <span className="text-[11px] text-neutral-400 italic">
                  No GPS pin dropped by customer (doorstep delivery relies on street address & landmark).
                </span>
              )}
            </div>
          </div>

          {/* Ordered Items List with Variant & supplier_sku */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="font-serif text-base font-bold text-neutral-900 pb-3 border-b border-neutral-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-800" />
              Ordered Items ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-neutral-100">
              {order.items?.map((it) => (
                <div key={it.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-neutral-900 text-sm">{it.productName}</p>
                    <div className="flex flex-wrap items-center gap-2 text-neutral-600">
                      {it.size && (
                        <span className="bg-neutral-100 px-2 py-0.5 rounded font-medium">
                          Size: {it.size}
                        </span>
                      )}
                      {it.color && (
                        <span className="bg-neutral-100 px-2 py-0.5 rounded font-medium">
                          Color: {it.color}
                        </span>
                      )}
                      <span className="text-neutral-500 font-bold">Qty: {it.quantity}</span>
                    </div>

                    {/* Supplier SKU for Markaz */}
                    {it.supplierSku && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Markaz Code:</span>
                        <code className="text-[11px] font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          {it.supplierSku}
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-neutral-900 text-sm">
                      {formatPKR(it.price * it.quantity)}
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      ({formatPKR(it.price)} each)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-sm font-bold text-neutral-900">
              <span>Total COD Collect Amount:</span>
              <span className="font-serif text-lg text-emerald-950">
                {formatPKR(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* COPY MARKAZ SUPPLIER ORDER DETAILS BUTTON */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            {order.status === 'pending_confirmation' && (
              <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  <strong>Supplier Lockout Warning:</strong> Order is unconfirmed. Confirm with customer before ordering from Markaz.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                  Markaz Supplier Order Details
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Ready-to-paste text block for placing this order inside Markaz App.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (order.status === 'pending_confirmation') {
                    if (
                      !confirm(
                        'Warning: This order is still pending confirmation! Do you still want to copy Markaz supplier details?'
                      )
                    ) {
                      return;
                    }
                  }
                  handleCopyMarkazText();
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition active:scale-95 shrink-0 ${order.status === 'pending_confirmation'
                  ? 'bg-amber-700 hover:bg-amber-600'
                  : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
              >
                {copiedMarkaz ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>
                      {order.status === 'pending_confirmation'
                        ? 'Copy Details (Unconfirmed)'
                        : 'Copy Markaz Details'}
                    </span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-neutral-800/80 p-3 rounded-2xl text-[11px] font-mono text-neutral-300 whitespace-pre-wrap max-h-48 overflow-y-auto border border-neutral-700/60">
              {order.markazOrderText}
            </pre>
          </div>

        </div>

        {/* Right Column (5 cols): Status Change, Fulfillment Tracking & Timeline */}
        <div className="lg:col-span-5 space-y-6">

          {/* Status Change Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              Update Order Status
            </h3>

            <form onSubmit={handleStatusSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Change Status To:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e: any) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-white font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  <option value="pending_confirmation">Pending Confirmation (Call Needed)</option>
                  <option value="confirmed">Confirmed (Verified with Customer)</option>
                  <option value="ordered_from_supplier">Ordered from Supplier (Markaz)</option>
                  <option value="shipped">Shipped with Courier</option>
                  <option value="delivered">Delivered & Collected</option>
                  <option value="returned_rto">Returned (RTO)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Timeline Event Note (Optional):
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Confirmed on WhatsApp call by customer"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition shadow-xs"
              >
                {isUpdatingStatus ? 'Updating Status...' : 'Apply Status Change'}
              </button>
            </form>
          </div>

          {/* Fulfillment Tracking Fields Card */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-4">
            <h3 className="font-serif text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-800" />
              Courier & Fulfillment Tracking
            </h3>

            <form onSubmit={handleFulfillmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Markaz / Supplier Order Ref #:
                </label>
                <input
                  type="text"
                  value={fulfillment.supplierOrderRef}
                  onChange={(e) => setFulfillment({ ...fulfillment, supplierOrderRef: e.target.value })}
                  placeholder="e.g. MKZ-902148"
                  className="w-full font-mono px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Courier Service:
                </label>
                <select
                  value={fulfillment.courier}
                  onChange={(e) => setFulfillment({ ...fulfillment, courier: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                >
                  <option value="PostEx">PostEx Logistics</option>
                  <option value="Leopards">Leopards Courier</option>
                  <option value="TCS">TCS Express</option>
                  <option value="Trax">Trax Logistics</option>
                  <option value="SelfRider">Store Rider (Lahore)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Tracking Number (CN):
                </label>
                <input
                  type="text"
                  value={fulfillment.trackingNumber}
                  onChange={(e) => setFulfillment({ ...fulfillment, trackingNumber: e.target.value })}
                  placeholder="e.g. 192837465"
                  className="w-full font-mono px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Internal Operations Notes:
                </label>
                <textarea
                  rows={2}
                  value={fulfillment.internalNotes}
                  onChange={(e) => setFulfillment({ ...fulfillment, internalNotes: e.target.value })}
                  placeholder="Internal notes for packaging and rider instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingFulfillment}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition shadow-xs flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingFulfillment ? 'Saving...' : 'Save Fulfillment Info'}</span>
              </button>
            </form>
          </div>

          {/* Timeline & Audit Events */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-xs space-y-3">
            <h3 className="font-serif text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-800" />
              Order Event Timeline
            </h3>

            <div className="space-y-3 text-xs">
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline.map((ev, i) => (
                  <div key={ev.id || i} className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-700 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-bold text-neutral-900">
                        {ORDER_STATUS_LABELS[ev.status] || ev.status}
                      </p>
                      {ev.note && <p className="text-neutral-600 mt-0.5">{ev.note}</p>}
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        {new Date(ev.createdAt).toLocaleString()} &bull; by {ev.actorName || 'Staff'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 italic">No events recorded.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

